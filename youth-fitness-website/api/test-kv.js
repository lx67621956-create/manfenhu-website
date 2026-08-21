// Test KV availability via @vercel/kv SDK
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const testKey = 'hermes_test_kv';

  // POST: Write test data
  if (req.method === 'POST') {
    try {
      const testData = {
        message: 'Test data from Hermes',
        timestamp: Date.now()
      };
      await kv.set(testKey, testData);
      return res.status(200).json({
        ok: true,
        action: 'write',
        message: 'Data written to KV'
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message,
        code: e.code || 'unknown'
      });
    }
  }

  // GET: Read test data
  if (req.method === 'GET') {
    const action = req.query.action || 'read';
    
    if (action === 'delete') {
      try {
        await kv.del(testKey);
        return res.status(200).json({
          ok: true,
          action: 'delete',
          message: 'Test key deleted'
        });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }

    // Default: read
    try {
      const value = await kv.get(testKey);
      return res.status(200).json({
        ok: true,
        action: 'read',
        value: value,
        exists: value !== null
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message,
        code: e.code || 'unknown'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
