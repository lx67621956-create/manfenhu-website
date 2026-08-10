// Agnes AI 生图代理 v2（Vercel Serverless）
// 流程：生图 → 服务端下载图片 → 转 base64 data URL 返回
// 优点：① 绕开图床 CORS（前端 canvas 合成不报错）② API Key 只在服务端
// Key 从 Vercel 环境变量 AGNES_API_KEY 读取（勿硬编码）
export default async function handler(req, res) {
  const AGNES_KEY = process.env.AGNES_API_KEY || '';
  if (!AGNES_KEY) {
    res.status(200).json({ dataUrl: null, error: 'AGNES_API_KEY 未配置' });
    return;
  }
  const prompt = (req.query.prompt || '').toString().slice(0, 600);
  try {
    // 1. 生图
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
    const url = j.data && j.data[0] && j.data[0].url;
    if (!url) {
      res.status(200).json({ dataUrl: null, error: '生图失败' });
      return;
    }
    // 2. 下载图片 → base64（绕开 CORS）
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      res.status(200).json({ dataUrl: null, error: '图片下载失败' });
      return;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const dataUrl = 'data:' + contentType + ';base64,' + buf.toString('base64');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ dataUrl, error: null });
  } catch (e) {
    res.status(200).json({ dataUrl: null, error: String((e && e.message) || e) });
  }
}
