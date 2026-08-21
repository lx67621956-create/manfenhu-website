// Elf data persistence API
// Uses Vercel KV REST API if configured, falls back to in-memory store

let memoryStore = {
  people: {},
  personOrder: [],
  curPerson: null,
  curSlot: null
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Generic KV helpers (support any key)
  async function kvGetKey(key) {
    if (!process.env.KV_REST_API_URL) return null;
    try {
      const r = await fetch(process.env.KV_REST_API_URL + '/get/' + key, {
        headers: process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {}
      });
      const d = await r.json();
      return d.result ? JSON.parse(d.result) : null;
    } catch { return null; }
  }

  async function kvSetKey(key, data) {
    if (!process.env.KV_REST_API_URL) return false;
    try {
      await fetch(process.env.KV_REST_API_URL + '/set/' + key, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {})
        },
        body: JSON.stringify(data)
      });
      return true;
    } catch { return false; }
  }

  // Legacy helpers for elf_data
  async function kvGet() {
    return await kvGetKey('elf_data');
  }

  async function kvSet(data) {
    await kvSetKey('elf_data', data);
  }

  // Test endpoint: can this file write to arbitrary keys?
  if (req.method === 'GET' && req.query.test === 'kv') {
    const testKey = 'data_api_test_' + Date.now();
    const writeOk = await kvSetKey(testKey, { test: 'from data.js', timestamp: Date.now() });
    const readBack = await kvGetKey(testKey);
    return res.status(200).json({
      ok: true,
      writeOk: writeOk,
      readBack: readBack,
      canWriteArbitraryKeys: writeOk && readBack !== null
    });
  }

  if (req.method === 'GET') {
    let data = await kvGet();
    if (!data) data = memoryStore;
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.people) {
        return res.status(400).json({ error: 'Invalid data' });
      }
      // 按人合并：只更新有更新的学生，不整体覆盖
      // 这样可以防止两个管理端同时操作互相覆盖
      const existing = memoryStore;
      Object.keys(body.people).forEach(name => {
        if (!existing.people[name] ||
            body.people[name].lastTimestamp > existing.people[name].lastTimestamp) {
          existing.people[name] = body.people[name];
        }
      });
      // 补充personOrder中新学生
      if (body.personOrder) {
        body.personOrder.forEach(n => {
          if (existing.personOrder.indexOf(n) < 0) existing.personOrder.push(n);
        });
      }
      memoryStore = existing;
      await kvSet(existing);
      return res.status(200).json({ ok: true, time: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
