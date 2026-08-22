// Elf data persistence API
// Uses Vercel KV (via @vercel/kv SDK, reads KV_URL env) with in-memory fallback.

import { kv } from '@vercel/kv';

const memoryStore = {
  people: {},
  personOrder: [],
  curPerson: null,
  curSlot: null,
  students: {
    index: [],
    records: {}
  }
};

const KEY = 'elf_data';

// --- Storage abstraction: try KV/Redis, fall back to memory (never silently) ---
let kvReady = false;
let store = memoryStore;

async function initStore() {
  try {
    // @vercel/kv auto-uses KV_URL / REDIS_URL / KV_REST_API_URL
    const exists = await kv.exists(KEY);
    kvReady = true;
    if (exists) {
      try { store = (await kv.get(KEY)) || memoryStore; } catch { store = memoryStore; }
    } else {
      store = memoryStore;
      await kv.set(KEY, store);
    }
    console.log('[data] KV ready:', kvReady);
  } catch (e) {
    kvReady = false;
    store = memoryStore;
    console.error('[data] KV init failed, using memory:', e.message);
  }
}

async function persist(force = false) {
  if (!kvReady) return { ok: false, reason: 'kv-unavailable' };
  try {
    await kv.set(KEY, store);
    return { ok: true };
  } catch (e) {
    console.error('[data] persist failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initStore();

  // Diagnostic: report storage backend status (read-only)
    if (req.method === 'GET' && req.query.diag === '1') {
      let restHost = null;
      try {
        const u = new URL(process.env.KV_REST_API_URL || '');
        restHost = u.hostname;
      } catch {}
      return res.status(200).json({
        ok: true,
        kvReady,
        backend: kvReady ? 'verb/kv' : 'memory',
        hasKVUrl: !!process.env.KV_URL,
        hasRedisUrl: !!process.env.REDIS_URL,
        hasRestUrl: !!process.env.KV_REST_API_URL,
        hasRestToken: !!process.env.KV_REST_API_TOKEN,
        restHost,
        studentCount: (store.students?.index || []).length
      });
    }

  // Student assessment records routes
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
      const { name, gender, currentGrade } = req.body;
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
      const p = await persist(true);
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true, studentId });
    }

    if (req.method === 'POST' && action === 'addRecord') {
      const { studentId, record } = req.body;
      if (!studentId || !record || !store.students.records[studentId]) {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }
      if (record.mode === 'guoti' && record.total > 100) {
        record.total = Math.min(100, Math.round(record.total * 10) / 10);
        record.max = 100;
      }
      const recordId = 'r_' + Date.now();
      const newRecord = { recordId, date: record.date || new Date().toISOString().split('T')[0], ...record };
      store.students.records[studentId].records.push(newRecord);
      const idx = store.students.index.findIndex(s => s.studentId === studentId);
      if (idx >= 0) {
        store.students.index[idx].recordCount = store.students.records[studentId].records.length;
        store.students.index[idx].lastRecordDate = newRecord.date;
      }
      const p = await persist();
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true, recordId });
    }

    if (req.method === 'POST' && action === 'delete') {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ ok: false, error: 'Missing studentId' });
      delete store.students.records[studentId];
      store.students.index = store.students.index.filter(s => s.studentId !== studentId);
      const p = await persist(true);
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true });
    }
  }

  // Elf data routes (legacy)
  if (req.method === 'GET') {
    return res.status(200).json({
      people: store.people,
      personOrder: store.personOrder,
      curPerson: store.curPerson,
      curSlot: store.curSlot,
      students: store.students || { index: [], records: {} }
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.people) {
        return res.status(400).json({ error: 'Invalid data' });
      }
      Object.keys(body.people).forEach(name => {
        const incoming = body.people[name];
        if (!store.people[name] || incoming.lastTimestamp > store.people[name].lastTimestamp) {
          store.people[name] = incoming;
        }
      });
      if (body.personOrder) {
        body.personOrder.forEach(n => {
          if (store.personOrder.indexOf(n) < 0) store.personOrder.push(n);
        });
      }
      if (body.students) {
        store.students = body.students;
      }
      const p = await persist();
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true, time: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}