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
  let budget = maxTokens;
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {          // 只在网络/5xx/预算被吃光时重试一次
    const body = JSON.stringify({ model: MODEL, messages, max_tokens: budget, temperature });
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
        if (choice.finish_reason === 'length') budget = Math.max(budget * 4, 8000);   // 加预算再试一次
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

  /* 只接受本站页面的调用（防别处拿这个 endpoint 烧额度）；非浏览器调用（本机脚本/服务端）不放 Origin，照常放行 */
  const origin = String((req.headers && (req.headers.origin || req.headers.referer)) || '');
  if (origin
      && !/^https?:\/\/(www\.)?manfenhu\.com(:\d+)?(\/|$)/.test(origin)
      && !/^https?:\/\/[a-z0-9-]+\.vercel\.app(\/|$)/i.test(origin)
      && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(origin)) {
    res.status(403).json({ ok: false, error: '来源不允许' });
    return;
  }

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

  // ── ③ 离线扩写话术库：给类别+现有示例，产出新候选（只产出，不入库；入库由人工审核后手动进行）──
  if (action === 'expand_copy') {
    const cat = String(body.category || '').slice(0, 60);
    const brief = String(body.brief || '').slice(0, 200);
    const examples = (Array.isArray(body.examples) ? body.examples : []).map(e => String(e).slice(0, 200)).slice(0, 12);
    const want = Math.min(Math.max(parseInt(body.count, 10) || 8, 1), 30);
    if (!cat || !examples.length) { res.status(200).json({ ok: false, error: '缺少类别或示例' }); return; }
    const shown = examples.map((e, i) => (i + 1) + '. ' + e).join('\n');
    const r = await chat([
      { role: 'system', content: '你是中考体育培训机构的班主任，在家长群里发日常关怀消息。文字要像真人班主任在手机上打的，不是系统发的。' },
      { role: 'user', content:
`【类别】${cat}${brief ? '（' + brief + '）' : ''}
【现有示例】照这个语气写，但意思不许重复它们：
${shown}

【写作要求】
1. 每条 50-75 字，1-3 句，家长群里能直接发出去。
2. 每条＝一句关怀 + 一个具体能做的动作，带上时间或数量（如"睡前十分钟""两三个""半小时"）。
3. 不用 emoji，不加标题，不用引号把整句包起来，不用"亲爱的家长朋友们"这类开场模板。
4. 不写空话（"祝孩子健康成长"这种没用的话）。
5. 不涉及疾病诊断、用药、医疗建议；不提任何政策文件、评分标准、考试分数。
6. 不用"建议/应该/务必/一定要"这类说教腔，用"记得/别/多/少"。
7. 不要"不是X而是Y"这种对偶句，不要金句收尾。
只输出 JSON：{"lines":["第一条","第二条"]}` }
    ], { maxTokens: 3000, temperature: 0.95 });
    if (r.error) { res.status(200).json({ ok: false, error: r.error }); return; }
    const j = pickJson(r.text);
    if (!j || !Array.isArray(j.lines)) { res.status(200).json({ ok: false, error: '模型没给出可解析的 JSON', raw: r.text.slice(0, 200) }); return; }
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;
    const norm = s => String(s).replace(/[\s，。！？；：、"'（）()《》…—~～!?,.:;]/g, '');
    const seen = new Set(examples.map(norm));
    const out = [], dropped = [];
    j.lines.forEach(v => {
      let t = String(v == null ? '' : v).trim().replace(/^\d+[\.、)]\s*/, '').replace(/^["'“”]+|["'“”]+$/g, '');
      if (!t) return;
      if (t.length < 20 || t.length > 140) { dropped.push('长度 ' + t.length); return; }
      if (EMOJI.test(t)) { dropped.push('含 emoji'); return; }
      if (seen.has(norm(t))) { dropped.push('重复'); return; }
      seen.add(norm(t));
      out.push(t);
    });
    res.status(200).json({ ok: true, category: cat, lines: out.slice(0, want), dropped: dropped.slice(0, 10), usage: r.usage });
    return;
  }

  // ── ④ 课后总结·句子：把详细版句子改写成"笼统版"（mode=any 时进一步泛化：不点动作/部位/技术名词）──
  if (action === 'summary_lines') {
    const proj = String(body.project || '').slice(0, 30);
    const band = String(body.band || '').slice(0, 10);          // low/mid/high
    const bandText = String(body.bandText || '').slice(0, 40);
    const anyMode = body.mode === 'any';
    const extraBanned = (Array.isArray(body.banned) ? body.banned : []).map(x => String(x).slice(0, 12)).filter(Boolean).slice(0, 60);
    const samples = (Array.isArray(body.samples) ? body.samples : []).map(x => String(x).slice(0, 200)).slice(0, 4);
    const want = Math.min(Math.max(parseInt(body.count, 10) || 2, 1), 8);
    if (!proj || !band) { res.status(200).json({ ok: false, error: '缺少项目或档位' }); return; }
    const spec = anyMode
      ? `【要求】写 ${want} 条"泛泛版"课后反馈（用在哪里都可能，所以什么都不能编）：
1. 每条 15-32 字，一句话，口语，像教练在群里随口说的。
2. 只讲这次课能直接看出来的：完成得稳不稳、跟不跟得上、投入不投入、有没有坚持下来、跟同伴配合怎么样。
3. **不许出现任何具体动作、身体部位或技术名词**（不写"垫球/运球/摇绳/起跳/摆臂/步伐/蹬地/发力/重心/手型/肘/膝/踝/腰腹/核心/呼吸节奏"这类），**也不要出现任何项目名**——项目名由系统自己加。
4. 不用"建议/应该/务必/一定要"；不安排课后作业；不做成绩承诺；不用 emoji；不写分数或档位。
5. 语气自然，别堆形容词、别排比、别押韵、别用"不仅…而且…"这类书面句式。
6. **不要出现主语**（不写"你/您/孩子/他/她"）——这句话既可能用在个人总结、也可能用在班级总结里，用"今天…/这次课…"开头就行。
只输出 JSON：{"lines":["第一条","第二条"]}`
      : `【要求】写 ${want} 条"笼统版"反馈：
1. 每条 25-45 字，1-2 句，家长一眼能看懂。
2. 只讲这次课能看出来的：完成得稳不稳、能不能跟上节奏、态度和投入情况。
3. 不写"中段呼吸急促""后程步频变慢""发力顺序不对"这类只有专门测验才看得出的技术细节。
4. 不用"建议/应该/务必/一定要"；不安排任何课后作业或练习（不出现"回家练/每天练/每周几次"）；不做成绩承诺。
5. 不用 emoji，不重复项目名，不写分数或档位。
只输出 JSON：{"lines":["第一条","第二条"]}`;
    const r = await chat([
      { role: 'system', content: '你是中考体育培训机构的教练，给孩子写课后训练反馈。话要说得住、不吹不贬，只描述这次课能看出来的东西。' },
      { role: 'user', content:
`【项目】${proj}
【本次完成度档位】${bandText || band}（1-10 分制）
【该项目的详细版句子（仅供体会语气，不要学它们的技术细节）】
${samples.map((s, i) => (i + 1) + '. ' + s).join('\n') || '（无）'}

${spec}` }
    ], { maxTokens: 3000, temperature: 0.9 });
    if (r.error) { res.status(200).json({ ok: false, error: r.error }); return; }
    const j = pickJson(r.text);
    if (!j || !Array.isArray(j.lines)) { res.status(200).json({ ok: false, error: '模型没给出可解析的 JSON', raw: r.text.slice(0, 200) }); return; }
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
    const BAN = /回家|每天|每周|建议|应该|务必|一定要|训练营|报班/;
    // 泛泛模式：具体动作 / 身体部位 / 技术名词 一律不许出现（"没练却写了"就是这么出的问题）
    const ACTION = /垫球|运球|投篮|传球|发球|扣球|摇绳|跳绳|起跳|落地|摆臂|手臂|步幅|步频|步伐|蹬地|发力|重心|手型|手腕|手指|肘|膝|踝|肩|腰腹|核心收紧|呼吸节奏|动作衔接|技术动作|姿势|角度|幅度|节奏感/;
    const blacklist = extraBanned;
    const norm = s => String(s).replace(/[\s，。！？；：、"'（）()《》…—~～!?,.:;]/g, '');
    const seen = new Set(samples.map(norm));
    const out = [], dropped = [];
    j.lines.forEach(v => {
      let t = String(v == null ? '' : v).trim().replace(/^\d+[\.、)]\s*/, '').replace(/^["'“”]+|["'“”]+$/g, '');
      if (!t) return;
      const lo = anyMode ? 10 : 12, hi = anyMode ? 40 : 80;
      if (t.length < lo || t.length > hi) { dropped.push('长度 ' + t.length); return; }
      if (EMOJI.test(t)) { dropped.push('含 emoji'); return; }
      if (BAN.test(t)) { dropped.push('含处方/作业词'); return; }
      if (anyMode && ACTION.test(t)) { dropped.push('含具体动作/部位'); return; }
      if (anyMode && /你|您|孩子|他|她/.test(t)) { dropped.push('带了主语(个人/班级都通用的句子不能有主语)'); return; }
      if (anyMode && blacklist.some(b => b.length >= 2 && t.includes(b))) { dropped.push('含项目名'); return; }
      if (seen.has(norm(t))) { dropped.push('重复'); return; }
      seen.add(norm(t));
      out.push(t);
    });
    res.status(200).json({ ok: true, project: proj, band: band, mode: anyMode ? 'any' : 'std', lines: out.slice(0, want), dropped: dropped.slice(0, 8), usage: r.usage });
    return;
  }

  res.status(200).json({ ok: false, error: '未知 action：' + action });
}
