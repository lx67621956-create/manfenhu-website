// Student data persistence API
// Storage: Vercel Blob (persistent) + seed file fallback
// - 有 BLOB_READ_WRITE_TOKEN 时：整个 store 作为一个 JSON blob 读写（重启/重新部署不丢）
// - 无 token 时：自动 fallback 到内存 + 种子文件（本地开发可用）
// 写入为原子覆盖整个 store；内部低频工具场景足够（极端并发时最后写入者生效）

import fs from 'fs';
import path from 'path';
import { put, get } from '@vercel/blob';

const SEED_FILE = path.join(process.cwd(), 'api', 'seed-data.json');
const STORE_KEY = 'manfenhu-store.json';

const defaultStore = {
  people: {},
  personOrder: [],
  curPerson: null,
  curSlot: null,
  students: {
    index: [],
    records: {}
  }
};

function normalizeStore(s) {
  const out = Object.assign({}, defaultStore, s || {});
  if (!out.people || typeof out.people !== 'object') out.people = {};
  if (!Array.isArray(out.personOrder)) out.personOrder = [];
  if (!out.students || typeof out.students !== 'object') out.students = { index: [], records: {} };
  if (!Array.isArray(out.students.index)) out.students.index = [];
  if (!out.students.records || typeof out.students.records !== 'object') out.students.records = {};
  return out;
}

function seedStore() {
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
      if (data && typeof data === 'object') return normalizeStore(data);
    }
  } catch (e) {
    console.error('[data] seed load failed:', e.message);
  }
  return normalizeStore(defaultStore);
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || '';
}

/* 无 token（内存模式）时使用的模块级缓存：
 * 首次请求从种子加载，之后写入/读取都走这份缓存，保证同一实例内数据持续存在。
 * 有 token（Blob 模式）时每次请求从 Blob 拉最新，保证多实例一致。 */
let memCache = null;

/* 从 Blob 读取整个 store（每次请求都读最新，保证多实例一致）。
 * 无 token → 使用模块级内存缓存（首请求读种子文件）；读失败 → 回退种子。
 * 读失败回退时若已有内存缓存，则继续用缓存避免覆盖内存中的数据。
 * 有 token → 直接按 pathname 读取：与 put(STORE_KEY,...) 写入的是同一对象，
 * 避免 list 前缀命中历史文件（早期随机后缀/旧格式）导致读写不同 blob；
 * useCache:false 绕过 CDN 缓存读源站最新，保证 put 后立刻读不回旧缓存。
 * 文件不存在（首次运行）→ 种子落盘后返回。 */
async function loadStore() {
  if (!blobToken()) {
    if (memCache) return memCache;
    memCache = seedStore();
    return memCache;
  }
  try {
    const g = await get(STORE_KEY, { access: 'private', useCache: false, token: blobToken() });
    if (!g) {
      const s = seedStore();
      await saveStore(s);
      memCache = s;
      return s;
    }
    const chunks = [];
    const reader = g.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    if (!raw) throw new Error('blob empty');
    const s = normalizeStore(JSON.parse(raw));
    memCache = s;
    return s;
  } catch (e) {
    console.error('[data] blob load failed:', e.message);
    if (memCache) return memCache;
    return seedStore();
  }
}

/* 将整个 store 原子覆盖写入 Blob（无 token 时仅更新内存缓存，保持内存存储）。
 * 返回 boolean：成功（含无 token 内存模式）→ true；Blob 写入失败 → false。
 * @vercel/blob 对相同 pathname 重复 put 必须 allowOverwrite:true，否则第二次起抛
 * "blob already exists"；如果不暴露失败，会被 catch 吞掉造成「假成功、数据未持久化」。 */
async function saveStore(s) {
  if (!blobToken()) { memCache = s; return true; }
  try {
    await put(STORE_KEY, JSON.stringify(s), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: blobToken()
    });
    return true;
  } catch (e) {
    console.error('[data] blob save failed:', e.message);
    return false;
  }
}

/* 将请求 body 归一化为 JS 对象（兼容不同 runtime 的 body 交付方式）：
 * - Vercel Node bridge 已解析 JSON → req.body 是普通对象，直接返回；
 * - req.body 缺失/undefined（老式 runtime 或 bodyParser 未命中）→ 流式读取原生请求体再 JSON.parse；
 * - req.body 是 web 风格 ReadableStream（新式 runtime）→ 读流拿到原始字符串；
 * - req.body 是 string/Buffer → 原样返回，由 handler 统一归一化。
 * 任何读取/解析异常都回退为空对象，绝不让 handler 因 body 解析崩溃或挂起。 */
function readBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined && req.body !== null) {
      // 新式 runtime 的 body 是 ReadableStream：读流后按字符串交给 handler 归一化
      if (typeof req.body.getReader === 'function') {
        const reader = req.body.getReader();
        const chunks = [];
        const pump = async () => {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
          }
          resolve(Buffer.concat(chunks).toString('utf8'));
        };
        pump().catch(() => resolve({}));
        return;
      }
      return resolve(req.body);
    }
    // 流只有真正 end 过才不会再触发事件；req.complete 只表示消息完整到达，
    // Vercel runtime 下 complete=true 时 body 可能仍可读，用它误判会导致 body 丢失。
    // 未 end 时订阅 data/end 即可（5s 超时兜底防挂起）。
    if (req.readableEnded) {
      return resolve({});
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) { // 1MB 上限保护
        try { req.destroy(); } catch { /* ignore */ }
        return resolve({});
      }
    });
    req.on('end', () => {
      try { resolve(data.trim() ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
    // 防挂起兜底：Vercel 请求体在函数被调用前已缓冲，正常 <50ms 到达；5s 无数据视为空 body
    setTimeout(() => resolve({}), 5000);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* 兼容不同运行时的 body 形式：Vercel serverless 可能把 JSON body 作为已解析对象、
   * 原始字符串、未解析（undefined，需手动读流）或 web ReadableStream。统一解析为对象。 */
  let body = await readBody(req);
  if (req.method === 'POST') {
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* 保留原字符串，下游会判 400 */ }
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch { /* kept as-is */ }
    }
    // 兜底：非对象 body（null / 数字 / 解析失败的字符串等）统一视为空对象，避免字段解构崩溃
    if (body === null || typeof body !== 'object') body = {};
    console.log('[data] POST reqBodyType=' + typeof req.body + ' keys=' + Object.keys(body).join(','));
  }

  const store = await loadStore();

  // Diagnostic
  if (req.method === 'GET' && req.query.diag === '1') {
    return res.status(200).json({
      ok: true,
      version: '2.1',
      backend: blobToken() ? 'blob+seed' : 'memory+seed',
      persistent: !!blobToken(),
      warning: blobToken() ? 'Data persisted to Vercel Blob.' : 'Data resets on cold start. Export regularly.',
      studentCount: (store.students?.index || []).length
    });
  }

  // Student routes
  if (req.query && req.query.students) {
    const action = req.query.students;
    if (!store.students) store.students = { index: [], records: {} };

    if (req.method === 'GET' && action === 'list') {
      return res.status(200).json({ ok: true, students: store.students.index });
    }

    if (req.method === 'GET' && action === 'get') {
      const sid = req.query.id;
      if (!sid || !store.students.records[sid]) {
        return res.status(404).json({ ok: false, error: 'Student not found' });
      }
      return res.status(200).json({ ok: true, student: store.students.records[sid] });
    }

    if (req.method === 'POST' && action === 'create') {
      const { name, gender, currentGrade } = body;
      if (!name || !gender || !currentGrade) {
        return res.status(400).json({ ok: false, error: 'Missing fields' });
      }
      const studentId = 's_' + Date.now();
      store.students.records[studentId] = {
        studentId, name, gender, currentGrade,
        createdAt: new Date().toISOString(), records: []
      };
      store.students.index.push({
        studentId, name, gender, currentGrade, recordCount: 0, lastRecordDate: null
      });
      const saved = await saveStore(store);
      if (!saved) return res.status(500).json({ ok: false, error: 'save failed' });
      return res.status(200).json({ ok: true, studentId });
    }

    if (req.method === 'POST' && action === 'addRecord') {
      const { studentId, record } = body;
      if (!studentId || !record || !store.students.records[studentId]) {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }
      if (record.mode === 'guoti' && record.total > 120) {
        record.total = Math.min(120, Math.round(record.total * 10) / 10);
        record.max = 120;
      }
      const recordId = 'r_' + Date.now();
      const newRecord = { recordId, date: record.date || new Date().toISOString().split('T')[0], ...record };
      store.students.records[studentId].records.push(newRecord);
      const idx = store.students.index.findIndex(s => s.studentId === studentId);
      if (idx >= 0) {
        store.students.index[idx].recordCount = store.students.records[studentId].records.length;
        store.students.index[idx].lastRecordDate = newRecord.date;
      }
      const saved = await saveStore(store);
      if (!saved) return res.status(500).json({ ok: false, error: 'save failed' });
      return res.status(200).json({ ok: true, recordId });
    }

    if (req.method === 'POST' && action === 'delete') {
      const { studentId } = body;
      if (!studentId) return res.status(400).json({ ok: false, error: 'Missing studentId' });
      delete store.students.records[studentId];
      store.students.index = store.students.index.filter(s => s.studentId !== studentId);
      const saved = await saveStore(store);
      if (!saved) return res.status(500).json({ ok: false, error: 'save failed' });
      return res.status(200).json({ ok: true });
    }

    // Export current state (for manual backup)
    if (req.method === 'GET' && action === 'export') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=students-backup.json');
      return res.status(200).json(store.students);
    }
  }

  // Generic GET: full store snapshot (elf pages)
  if (req.method === 'GET') {
    return res.status(200).json({
      people: store.people,
      personOrder: store.personOrder,
      curPerson: store.curPerson,
      curSlot: store.curSlot,
      students: store.students || { index: [], records: {} }
    });
  }

  // Generic POST: merge people/personOrder/students (elf pages)
  if (req.method === 'POST') {
    try {
      const body2 = body;
      if (!body2 || !body2.people) {
        return res.status(400).json({ error: 'Invalid data' });
      }
      Object.keys(body2.people).forEach(name => {
        const incoming = body2.people[name];
        if (!store.people[name] || incoming.lastTimestamp > store.people[name].lastTimestamp) {
          store.people[name] = incoming;
        }
      });
      if (body2.personOrder) {
        body2.personOrder.forEach(n => {
          if (store.personOrder.indexOf(n) < 0) store.personOrder.push(n);
        });
      }
      if (body2.students) {
        store.students = body2.students;
      }
      const saved = await saveStore(store);
      if (!saved) return res.status(500).json({ ok: false, error: 'save failed' });
      return res.status(200).json({ ok: true, time: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}