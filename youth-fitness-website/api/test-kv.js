// Test KV availability (REST API, same pattern as api/data.js)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const testKey = 'hermes_test_kv';

  // KV helper functions (copied from api/data.js pattern)
  async function kvGet(key) {
    if (!process.env.KV_REST_API_URL) return null;
    try {
      const r = await fetch(process.env.KV_REST_API_URL + '/get/' + key, {
        headers: process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {}
      });
      const d = await r.json();
      return d.result ? JSON.parse(d.result) : null;
    } catch (e) {
      return null;
    }
  }

  async function kvSet(key, data) {
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
    } catch (e) {
      return false;
    }
  }

  async function kvDel(key) {
    if (!process.env.KV_REST_API_URL) return false;
    try {
      await fetch(process.env.KV_REST_API_URL + '/del/' + key, {
        method: 'POST',
        headers: process.env.KV_REST_API_TOKEN ? { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } : {}
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  // POST: Write test data
  if (req.method === 'POST') {
    const testData = {
      message: 'Test data from Hermes',
      timestamp: Date.now()
    };
    const ok = await kvSet(testKey, testData);
    return res.status(200).json({
      ok: ok,
      action: 'write',
      message: ok ? 'Data written to KV' : 'KV write failed or not configured'
    });
  }

  // GET: Read or delete test data
  if (req.method === 'GET') {
    const action = req.query.action || 'read';
    
    if (action === 'delete') {
      const ok = await kvDel(testKey);
      return res.status(200).json({
        ok: ok,
        action: 'delete',
        message: ok ? 'Test key deleted' : 'KV delete failed or not configured'
      });
    }

    // Default: read
    const value = await kvGet(testKey);
    return res.status(200).json({
      ok: true,
      action: 'read',
      value: value,
      exists: value !== null
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
