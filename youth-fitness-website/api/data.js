// Elf data persistence API
// Uses Vercel Blob for durable cross-deployment storage

import { put, list } from '@vercel/blob';

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

const BLOB_FILENAME = 'elf_data.json';

let blobReady = false;
let blobProbe = null;
let store = memoryStore;
let currentBlobUrl = null;

async function initStore() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    blobProbe = { ok: false, reason: 'no token' };
    blobReady = false;
    return;
  }
  
  try {
    const result = await list({ token, limit: 100 });
    const existing = result.blobs.find(b => b.pathname === BLOB_FILENAME);
    
    if (existing) {
      currentBlobUrl = existing.url;
      const res = await fetch(existing.url);
      const text = await res.text();
      store = JSON.parse(text);
      blobReady = true;
      blobProbe = { ok: true, loaded: true };
      console.log('[data] loaded from blob, students=', (store.students?.index || []).length);
    } else {
      blobReady = true;
      blobProbe = { ok: true, firstRun: true };
      console.log('[data] first run, will create blob on write');
    }
  } catch (e) {
    blobReady = false;
    blobProbe = { ok: false, reason: e.message };
    console.error('[data] init failed:', e.message);
  }
}

async function persist() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobReady || !token) {
    return { ok: false, reason: 'unavailable' };
  }
  
  try {
    const json = JSON.stringify(store);
    // Use random suffix to create new blob, then we'll clean up old ones periodically
    const blob = await put(BLOB_FILENAME, json, {
      access: 'public',
      token,
      contentType: 'application/json'
    });
    
    currentBlobUrl = blob.url;
    console.log('[data] persisted');
    return { ok: true };
  } catch (e) {
    console.error('[data] persist error:', e.message);
    return { ok: false, reason: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initStore();

  // Diagnostic
  if (req.method === 'GET' && req.query.diag === '1') {
    return res.status(200).json({
      ok: true,
      blobReady,
      backend: blobReady ? 'blob' : 'memory',
      blobProbe,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
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
      const p = await persist();
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
      const p = await persist();
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true });
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
      const p = await persist();
      if (!p.ok) return res.status(500).json({ ok: false, error: 'Persist failed', detail: p });
      return res.status(200).json({ ok: true, time: Date.now() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
