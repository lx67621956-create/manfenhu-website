// Student Assessment Records API
// CRUD for student archives with persistent storage in Vercel KV

export const config = {
  runtime: 'nodejs18.x'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse body for POST (Vercel auto-parses JSON but add safety)
  let body = req.body;
  if (req.method === 'POST' && typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  // KV helper functions (same pattern as api/data.js)
  async function kvGet(key) {
    if (!process.env.KV_REST_API_URL) return null;
    try {
      const r = await fetch(process.env.KV_REST_API_URL + '/get/' + key, {
        headers: process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {}
      });
      const d = await r.json();
      return d.result ? JSON.parse(d.result) : null;
    } catch { return null; }
  }

  async function kvSet(key, data) {
    if (!process.env.KV_REST_API_URL) return { ok: false, error: 'No KV_REST_API_URL' };
    try {
      const url = process.env.KV_REST_API_URL + '/set/' + key;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {})
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: 'HTTP ' + res.status, detail: text.slice(0, 200) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message, stack: e.stack?.slice(0, 200) };
    }
  }

  async function kvDel(key) {
    if (!process.env.KV_REST_API_URL) return;
    try {
      await fetch(process.env.KV_REST_API_URL + '/del/' + key, {
        method: 'POST',
        headers: process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {}
      });
    } catch {}
  }

  const INDEX_KEY = 'assessment:index';

  // Helper: get student index
  async function getIndex() {
    const idx = await kvGet(INDEX_KEY);
    return idx || { students: [] };
  }

  // Helper: update index
  async function updateIndex(index) {
    return await kvSet(INDEX_KEY, index);
  }

  // Diagnostic: test KV write
  if (req.method === 'GET' && req.query.action === 'diag') {
    // Test 1: simple key (no colon)
    const test1 = await kvSet('assessment_diag_test', { test: Date.now() });
    // Test 2: key with colon
    const test2 = await kvSet('assessment:diag:test', { test: Date.now() });
    // Test 3: read back test1
    const read1 = await kvGet('assessment_diag_test');
    return res.status(200).json({
      ok: true,
      test1_simple: test1,
      test2_colon: test2,
      read1: read1,
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN
    });
  }

  // GET: list students or get one student
  if (req.method === 'GET') {
    const action = req.query.action || 'list';
    
    if (action === 'list') {
      const index = await getIndex();
      return res.status(200).json({
        ok: true,
        students: index.students
      });
    }

    if (action === 'get') {
      const studentId = req.query.studentId;
      if (!studentId) {
        return res.status(400).json({ ok: false, error: 'Missing studentId' });
      }
      const student = await kvGet('assessment:student:' + studentId);
      if (!student) {
        return res.status(404).json({ ok: false, error: 'Student not found' });
      }
      return res.status(200).json({
        ok: true,
        student: student
      });
    }

    return res.status(400).json({ ok: false, error: 'Invalid action' });
  }

  // POST: create, addRecord, deleteRecord, deleteStudent
  if (req.method === 'POST') {
    if (!body || !body.action) {
      return res.status(400).json({ ok: false, error: 'Missing action' });
    }

    const action = body.action;

    // Create new student
    if (action === 'create') {
      const { name, gender, currentGrade } = body;
      if (!name || !gender || !currentGrade) {
        return res.status(400).json({ ok: false, error: 'Missing name/gender/currentGrade' });
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
      const ok1 = await kvSet('assessment:student:' + studentId, student);
      if (!ok1 || !ok1.ok) {
        return res.status(500).json({ ok: false, error: 'KV write failed', detail: ok1 });
      }
      
      // Update index
      const index = await getIndex();
      index.students.push({
        studentId,
        name,
        gender,
        currentGrade,
        recordCount: 0,
        lastRecordDate: null
      });
      const ok2 = await updateIndex(index);
      if (!ok2 || !ok2.ok) {
        return res.status(500).json({ ok: false, error: 'Index update failed', detail: ok2 });
      }
      
      return res.status(200).json({
        ok: true,
        studentId: studentId
      });
    }

    // Add record to student
    if (action === 'addRecord') {
      const { studentId, record } = body;
      if (!studentId || !record) {
        return res.status(400).json({ ok: false, error: 'Missing studentId or record' });
      }
      const student = await kvGet('assessment:student:' + studentId);
      if (!student) {
        return res.status(404).json({ ok: false, error: 'Student not found' });
      }
      
      const recordId = 'r_' + Date.now();
      const newRecord = {
        recordId,
        date: record.date || new Date().toISOString().split('T')[0],
        ...record
      };
      student.records.push(newRecord);
      await kvSet('assessment:student:' + studentId, student);
      
      // Update index
      const index = await getIndex();
      const idx = index.students.findIndex(s => s.studentId === studentId);
      if (idx >= 0) {
        index.students[idx].recordCount = student.records.length;
        index.students[idx].lastRecordDate = newRecord.date;
      }
      await updateIndex(index);
      
      return res.status(200).json({
        ok: true,
        recordId: recordId
      });
    }

    // Delete record
    if (action === 'deleteRecord') {
      const { studentId, recordId } = body;
      if (!studentId || !recordId) {
        return res.status(400).json({ ok: false, error: 'Missing studentId or recordId' });
      }
      const student = await kvGet('assessment:student:' + studentId);
      if (!student) {
        return res.status(404).json({ ok: false, error: 'Student not found' });
      }
      
      student.records = student.records.filter(r => r.recordId !== recordId);
      await kvSet('assessment:student:' + studentId, student);
      
      // Update index
      const index = await getIndex();
      const idx = index.students.findIndex(s => s.studentId === studentId);
      if (idx >= 0) {
        index.students[idx].recordCount = student.records.length;
        index.students[idx].lastRecordDate = student.records.length > 0 ? student.records[student.records.length - 1].date : null;
      }
      await updateIndex(index);
      
      return res.status(200).json({ ok: true });
    }

    // Delete student
    if (action === 'deleteStudent') {
      const { studentId } = body;
      if (!studentId) {
        return res.status(400).json({ ok: false, error: 'Missing studentId' });
      }
      
      await kvDel('assessment:student:' + studentId);
      
      // Update index
      const index = await getIndex();
      index.students = index.students.filter(s => s.studentId !== studentId);
      await updateIndex(index);
      
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
