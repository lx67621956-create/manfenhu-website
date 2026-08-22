// Elf data persistence API
// Uses Vercel Blob for durable cross-deployment storage

import { put, head } from '@vercel/blob';

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

const BLOB_PATH = 'elf_data.json';

let blobReady = false;
let blobProbe = null;
let store = memoryStore;

async function initStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    blobProbe = { ok: false, reason: 'no BLOB_READ_WRITE_TOKEN' };
    blobReady = false;
    console.log('[data] Blob unavailable, using memory');
    return;
  }
  try {
    // Try to fetch existing blob
    const checkBlob = await head(BLOB_PATH, { token: process.env.BLOB_READ_WRITE_TOKEN });
    if (checkBlob && checkBlob.url) {
      const res = await fetch(checkBlob.url);
      if (res.ok) {
        const text = await res.text();
        store = JSON.parse(text);
        blobReady = true;
        blobProbe = { ok: true, size: checkBlob.size };
        console.log('[data] Blob loaded, students=', (store.students?.index || []).length);
      }
    } else {
      // Blob doesn't exist yet, will create on first write
      blobReady = true;
      blobProbe = { ok: true, size: 0, firstRun: true };
      console.log('[data] Blob empty, will create on write');
    }
  } catch (e) {
    // Blob not found is OK on first run
    if (e.message?.includes('does not exist') || e.message?.includes('BlobNotFoundError') || e.message?.includes('404')) {
      blobReady = true;
      blobProbe = { ok: true, size: 0, firstRun: true };
      console.log('[data] Blob not found (first run), will create on write');
    } else {
      blobReady = false;
      blobProbe = { ok: false, reason: e.message };
      console.error('[data] Blob init failed:', e.message);
    }
  }
}

async function persist() {
  if (!blobReady || !process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, reason: 'blob-unavailable' };
  }
  try {
    const json = JSON.stringify(store);
    const blob = await put(BLOB_PATH, json, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/json'
    });
    console.log('[data] persisted to blob, url=', blob.url.slice(0, 60));
    return { ok: true, url: blob.url };
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
