// Test KV availability
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: 'KV not configured',
      env: {
        hasUrl: !!KV_URL,
        hasToken: !!KV_TOKEN,
        urlPrefix: KV_URL ? KV_URL.slice(0, 30) + '...' : null
      }
    });
  }

  const testKey = 'hermes_test_kv';
  const testValue = JSON.stringify({
    message: 'Test data from Hermes',
    timestamp: Date.now()
  });

  // POST: Write test data
  if (req.method === 'POST') {
    try {
      const testData = {
        message: 'Test data from Hermes',
        timestamp: Date.now()
      };
      const setRes = await fetch(`${KV_URL}/set/${testKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_TOKEN}`
        },
        body: JSON.stringify(testData)
      });
      
      if (!setRes.ok) {
        const errorText = await setRes.text();
        return res.status(500).json({
          ok: false,
          error: 'KV set failed',
          status: setRes.status,
          statusText: setRes.statusText,
          response: errorText.slice(0, 200)
        });
      }
      
      const setData = await setRes.json();
      return res.status(200).json({
        ok: true,
        action: 'write',
        result: setData
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message,
        stack: e.stack?.slice(0, 300)
      });
    }
  }

  // GET: Read test data
  if (req.method === 'GET') {
    const action = req.query.action || 'read';
    
    if (action === 'delete') {
      try {
        const delRes = await fetch(`${KV_URL}/del/${testKey}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
        });
        const delData = await delRes.json();
        return res.status(200).json({
          ok: true,
          action: 'delete',
          result: delData
        });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }

    // Default: read
    try {
      const getRes = await fetch(`${KV_URL}/get/${testKey}`, {
        headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
      });
      const getData = await getRes.json();
      const value = getData.result ? JSON.parse(getData.result) : null;
      return res.status(200).json({
        ok: true,
        action: 'read',
        value: value,
        raw: getData
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
