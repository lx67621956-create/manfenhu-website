// Agnes AI 生图代理（Vercel Serverless）
// 用途：家长群海报 AI 背景图。API Key 只存在服务端，不暴露给浏览器。
export default async function handler(req, res) {
  const AGNES_KEY = 'sk-qDTT18LE3nBpM11YC1DCuORPAdCYFYwrlq7UamKDJwJvfNaw';
  const prompt = (req.query.prompt || '').toString().slice(0, 600);
  try {
    const r = await fetch('https://api.agnes-ai.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + AGNES_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'agnes-image-2.1-flash',
        prompt: prompt || 'cute cartoon sports background for kids fitness poster, warm orange tones, flat illustration, no text',
        size: '1024x1536'
      })
    });
    const j = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      url: (j.data && j.data[0] && j.data[0].url) || null,
      error: null
    });
  } catch (e) {
    res.status(200).json({ url: null, error: String((e && e.message) || e) });
  }
}
