// Elf data persistence API
// Uses Vercel KV REST API if configured, falls back to in-memory store

let memoryStore = {
  people: {},
  personOrder: [],
  curPerson: null,
  curSlot: null,
  // Student assessment records (new)
  students: {
    index: [],
    records: {}
  }
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

  // Student assessment records routes
  if (req.url?.startsWith('/api/data?students=')) {
    const action = req.query.students;
    let data = await kvGet();
    if (!data) data = memoryStore;
    if (!data.students) data.students = { index: [], records: {} };

    // List students
    if (req.method === 'GET' && action === 'list') {
      return res.status(200).json({
        ok: true,
        students: data.students.index
      });
    }

    // Get one student
    if (req.method === 'GET' && action === 'get') {
      const sid = req.query.id;
      if (!sid || !data.students.records[sid]) {
        return res.status(404).json({ ok: false, error: 'Student not found' });
      }
      return res.status(200).json({
        ok: true,
        student: data.students.records[sid]
      });
    }

    // Create student
    if (req.method === 'POST' && action === 'create') {
      const { name, gender, currentGrade } = req.body;
      if (!name || !gender || !currentGrade) {
        return res.status(400).json({ ok: false, error: 'Missing fields' });
      }
      const studentId = 's_' + Date.now();
      const student = {
        studentId,
        name,
        gender,
        currentGrade,
        createdAt: new Date().toISOString(),
        records: []
      };
      data.students.records[studentId] = student;
      data.students.index.push({
        studentId,
        name,
        gender,
        currentGrade,
        recordCount: 0,
        lastRecordDate: null
      });
      await kvSet(data);
      return res.status(200).json({ ok: true, studentId });
    }

    // Add record
    if (req.method === 'POST' && action === 'addRecord') {
      const { studentId, record } = req.body;
      if (!studentId || !record || !data.students.records[studentId]) {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }
      const recordId = 'r_' + Date.now();
      const newRecord = {
        recordId,
        date: record.date || new Date().toISOString().split('T')[0],
        ...record
      };
      data.students.records[studentId].records.push(newRecord);
      const idx = data.students.index.findIndex(s => s.studentId === studentId);
      if (idx >= 0) {
        data.students.index[idx].recordCount = data.students.records[studentId].records.length;
        data.students.index[idx].lastRecordDate = newRecord.date;
      }
      await kvSet(data);
      return res.status(200).json({ ok: true, recordId });
    }

    // Delete student
    if (req.method === 'POST' && action === 'delete') {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ ok: false, error: 'Missing studentId' });
      }
      delete data.students.records[studentId];
      data.students.index = data.students.index.filter(s => s.studentId !== studentId);
      await kvSet(data);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
