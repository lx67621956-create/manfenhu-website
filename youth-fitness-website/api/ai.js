// 满分虎小工具 · AI 通道（Vercel Serverless）
// 只用 DeepSeek V4.1 Flash（opencode Go 订阅套餐）——模型名写死在服务端，
// 前端无法传模型/接口地址，避免误用贵的模型。Key 从 Vercel 环境变量读，勿硬编码。
//
// 动作：
//   GET  ?probe=1        探活 + 列出上游可用模型（排障用）
//   POST {action:'parse_scores', ...}    教练粘贴的成绩文本 → 结构化数值
//   POST {action:'parent_comment', ...}  测评结果 → 一段可直接发家长的评语
export const config = { maxDuration: 60 };

const BASE = 'https://opencode.ai/zen/go/v1';
const MODEL = 'deepseek-v4.1-flash';
// OpenCode 中转要求每个请求带 x-opencode-session（缺了直接 400 MissingSessionID），
// 同值请求会被固定路由到同一后端，提示词缓存命中更稳。固定一个值即可。
const SESSION = 'manfenhu-tools-v1';
const KEY = () => process.env.OPENCODE_GO_API_KEY || '';

async function chat(messages, { maxTokens = 900, temperature = 0.5, timeoutMs = 50000 } = {}) {
  const key = KEY();
  if (!key) return { error: 'OPENCODE_GO_API_KEY 未配置' };
  const body = JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature });
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {          // 只在网络/5xx 时重试一次
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(BASE + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'x-opencode-session': SESSION },
        body,
        signal: ctl.signal
      });
      const txt = await r.text();
      if (!r.ok) {
        lastErr = '上游 HTTP ' + r.status + '：' + txt.slice(0, 180);
        if (r.status < 500) return { error: lastErr };
        continue;
      }
      const d = JSON.parse(txt);
      const choice = (d.choices && d.choices[0]) || {};
      const msg = choice.message || {};
      const text = msg.content || '';
      if (!text) {
        // 空内容多半是 max_tokens 被思考过程吃光（finish_reason=length），把原因带回去便于排查
        lastErr = '上游返回空内容（finish=' + (choice.finish_reason || '?') +
          ', reasoning=' + String(msg.reasoning_content || '').length + ' 字符, usage=' + JSON.stringify(d.usage || {}) + '）';
        continue;
      }
      return { text, usage: d.usage || null, model: d.model || MODEL };
    } catch (e) {
      lastErr = '调用失败：' + String((e && e.message) || e);
    } finally {
      clearTimeout(timer);
    }
  }
  return { error: lastErr };
}

// 上游可能把 JSON 包在 ``` 里，或前后带一句话；宽松取出第一个 {...}
function pickJson(text) {
  let s = String(text || '').replace(/```[a-z]*/gi, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}

const PARSE_SYSTEM = '你是成绩录入助手。只做一件事：把教练粘贴的成绩文字对应到给定字段上。严格只输出 JSON，不要任何解释。';

const COMMENT_SYSTEM = [
  '你是中考体育培训机构的教练，给家长写一条成绩点评（会直接复制到微信里发出去）。',
  '说人话，像教练本人在手机上打的字，不是系统生成的报告。'
].join('');

const COMMENT_RULES = [
  '必须遵守：',
  '1. 一段话，130-180 字（不要超过 200 字），不分小标题、不用 emoji、不用 markdown 符号。',
  '2. 只讲成绩单上能看到的事实：哪项拿得稳、哪项丢分最多、跟上次比快了多少/进步多少（只有给了上次成绩才写对比）。',
  '3. 不写"建议练/回家练/加强训练/每天坚持/要注意"这类处方话；不写"一定能/保证/必然"；不评价孩子聪明与否。',
  '4. 不要"这不叫X这叫Y"这种对偶句，不要金句收尾，不要堆感叹号。',
  '5. 直接给正文，不要标题，不要"评语："前缀。'
].join('\n');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // ── 探活 ──────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!(req.query && req.query.probe)) {
      res.status(200).json({ ok: true, model: MODEL, hint: 'POST {action} 调用' });
      return;
    }
    const key = KEY();
    if (!key) { res.status(200).json({ ok: false, error: 'OPENCODE_GO_API_KEY 未配置' }); return; }
    try {
      const r = await fetch(BASE + '/models', {
        headers: { Authorization: 'Bearer ' + key, 'x-opencode-session': SESSION },
        signal: AbortSignal.timeout(20000)
      });
      const txt = await r.text();
      let ids = [];
      try { ids = (JSON.parse(txt).data || []).map(m => m.id); } catch (e) {}
      res.status(200).json({ ok: r.ok, status: r.status, base: BASE, keyLen: key.length, models: ids.slice(0, 40), raw: r.ok ? null : txt.slice(0, 300) });
    } catch (e) {
      res.status(200).json({ ok: false, base: BASE, keyLen: key.length, error: String((e && e.message) || e) });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const action = String(body.action || '');

  // ── ① 粘贴文本 → 结构化成绩 ─────────────────────────
  if (action === 'parse_scores') {
    const text = String(body.text || '').slice(0, 1500);
    const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
    if (!text.trim() || !items.length) { res.status(200).json({ ok: false, error: '缺少文本或字段清单' }); return; }
    const allowed = items.map(i => String(i.key || '')).filter(Boolean);
    const list = items.map(i => `${i.key} | ${i.name} | ${i.unit || ''} | ${i.hint || ''}`).join('\n');
    const r = await chat([
      { role: 'system', content: PARSE_SYSTEM },
      { role: 'user', content:
`【可填字段】key | 名称 | 单位 | 说明
${list}

【粘贴文本】
${text}

要求：
1. 只填文本里真实出现的项目；没出现的不要编造，也不要填 0。
2. 计时项目单位是"秒"，必须换算成秒的数字：4分20秒=260，3'50=230，1分45秒=105，4:05=245。
3. 值只给数字，不带单位。身高、体重分别用 key bmi_h 和 bmi_w。
4. 文本里对不上的内容原样放进 unmatched 数组。
只输出 JSON，格式：{"values":{"vital":2600,"run800":260},"unmatched":[]}` }
    ], { maxTokens: 700, temperature: 0.1 });
    if (r.error) { res.status(200).json({ ok: false, error: r.error }); return; }
    const j = pickJson(r.text);
    if (!j || typeof j.values !== 'object') { res.status(200).json({ ok: false, error: '模型没给出可解析的 JSON', raw: r.text.slice(0, 200) }); return; }
    const values = {};
    for (const k of Object.keys(j.values)) {                 // 服务端校验：只收清单里的 key + 合法数字
      if (allowed.indexOf(k) < 0) continue;
      const v = Number(j.values[k]);
      if (isFinite(v) && v !== 0) values[k] = v;
    }
    res.status(200).json({ ok: true, values, unmatched: Array.isArray(j.unmatched) ? j.unmatched.slice(0, 8) : [], usage: r.usage });
    return;
  }

  // ── ② 测评结果 → 家长版评语 ──────────────────────────
  if (action === 'parent_comment') {
    const info = body.info && typeof body.info === 'object' ? body.info : {};
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 20) : [];
    if (!rows.length) { res.status(200).json({ ok: false, error: '缺少成绩行' }); return; }
    const lines = rows.map(r => `${r.name}：实测 ${r.raw}，得 ${r.score}/${r.max} 分`).join('\n');
    const head = [info.grade ? `${info.grade}` : '', info.sexText || '', info.name ? `姓名 ${info.name}` : '']
      .filter(Boolean).join(' · ');
    const hist = info.history ? `\n【上次成绩对比】\n${String(info.history).slice(0, 600)}` : '';
    const r = await chat([
      { role: 'system', content: COMMENT_SYSTEM },
      { role: 'user', content:
`【学生】${head || '未填姓名'}
【本次总分】${info.total} / ${info.maxTotal}，等级：${info.level}
【各单项】
${lines}
【加分项】${info.bonus || '无'}${hist}

${COMMENT_RULES}` }
    ], { maxTokens: 4000, temperature: 0.7 });
    if (r.error) { res.status(200).json({ ok: false, error: r.error }); return; }
    res.status(200).json({ ok: true, text: r.text.trim(), usage: r.usage });
    return;
  }

  res.status(200).json({ ok: false, error: '未知 action：' + action });
}
