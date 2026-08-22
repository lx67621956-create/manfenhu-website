// Elf data persistence API
// Hybrid: seed from JSON file + memory runtime cache
// Note: writes during runtime are NOT persisted across deployments
// To persist data permanently, manually update seed-data.json and redeploy

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'api', 'seed-data.json');

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

let store = defaultStore;
let initialized = false;

function initStore() {
  if (initialized) return;
  
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = fs.readFileSync(SEED_FILE, 'utf8');
      store = JSON.parse(data);
      console.log('[data] loaded from seed, students=', (store.students?.index || []).length);
    } else {
      console.log('[data] no seed file, using defaults');
    }
  } catch (e) {
    console.error('[data] seed load failed:', e.message);
  }
  initialized = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  initStore();

  // Diagnostic
  if (req.method === 'GET' && req.query.diag === '1') {
    return res.status(200).json({
      ok: true,
      backend: 'memory+seed',
      persistent: false,
      warning: 'Data resets on cold start. Export regularly.',
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
      return res.status(200).json({ ok: true, recordId });
    }

    if (req.method === 'POST' && action === 'delete') {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ ok: false, error: 'Missing studentId' });
      delete store.students.records[studentId];
      store.students.index = store.students.index.filter(s => s.studentId !== studentId);
      return res.status(200).json({ ok: true });
    }
    
    // Export current state (for manual backup)
    if (req.method === 'GET' && action === 'export') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=students-backup.json');
      return res.status(200).json(store.students);
    }
  }

  // Elf routes
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
      return res.status(200).json({ ok: true, time: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
