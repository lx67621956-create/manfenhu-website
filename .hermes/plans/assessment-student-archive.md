# 成绩测评工具 → 学员体质成长档案系统

## 项目概述

**目标**：把现有的单次测评工具（assessment.html）升级为学员成长档案系统，支持：
- 保存学员姓名、年级、性别
- 每次测评自动记录日期和完整成绩
- 查看历史测评记录
- 总分和单项成长趋势图
- 雷达图前后对比
- 本次相对上次的进步/退步提示
- 导出学员成长档案（CSV/图片）
- 导出全体学员成绩表（Excel/CSV）

**关键原则**：
- 数据必须持久化到云端（Vercel KV / Redis），不能只存浏览器 localStorage
- 新增独立 API `api/assessment-records.js`，不污染现有 `api/data.js`
- 保持现有"保存测评图片"功能（单次报告发家长），新增"保存进学员档案"（内部管理）
- 第一版不保存图片到数据库，仅保存 JSON 成绩数据
- 第一版内部使用，暂不做权限控制（第二版再加管理员登录）

---

## 阶段拆分

### 阶段 0：验证现有 KV 存储可用性（前置依赖）

**目标**：确认 Vercel KV 环境变量已配置且能稳定读写

**步骤**：
1. 创建测试 API `api/_test-kv.js`，实现 GET/POST 两个端点
2. POST 写入测试数据 `{"testKey": "testValue", "timestamp": Date.now()}`
3. GET 读回
4. 部署 Vercel
5. 用 curl 测试读写
6. Vercel 重新部署后再次读取，验证数据持久化
7. 删除测试 key
8. 删除 `api/_test-kv.js`

**交付物**：
- 确认 KV 可用的测试日志
- 现有 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 可直接使用

**风险**：
- 如果 KV 环境变量未正确配置，需先到 Vercel 控制台补配置
- 如果 KV 服务未开通，需先开通 Upstash Redis / Vercel KV

---

### 阶段 1：后端 API - 学员档案 CRUD

**目标**：创建独立 API，支持学员档案的增删改查

**文件**：`youth-fitness-website/api/assessment-records.js`

**数据结构**：

```js
// Redis Key: assessment:student:{studentId}
{
  "studentId": "s_1724239200000",  // 时间戳生成唯一ID
  "name": "张三",
  "gender": "M",
  "currentGrade": "8",
  "createdAt": "2026-08-21T12:00:00Z",
  "records": [
    {
      "recordId": "r_1724239200000",
      "date": "2026-08-21",
      "grade": "8",  // 测评时的年级
      "gender": "M",
      "mode": "guoti",  // guoti / xc
      "total": 89.5,
      "max": 100,
      "pct": 89.5,
      "level": "良好",
      "scores": {
        "bmi": { "score": 92, "max": 100, "display": "18.5", "name": "BMI" },
        "vital": { "score": 88, "max": 100, "display": "2600", "name": "肺活量" },
        "run50": { "score": 90, "max": 100, "display": "8.7", "name": "50米跑" }
        // ... 其他项目
      },
      "dimensions": {
        "速度": 90,
        "耐力": 82,
        "力量": 88,
        "柔韧": 92,
        "协调": 85,
        "心肺": 88,
        "体态": 92
      }
    }
  ]
}

// Redis Key: assessment:index (学员列表索引)
{
  "students": [
    { "studentId": "s_1724239200000", "name": "张三", "gender": "M", "currentGrade": "8", "recordCount": 3, "lastRecordDate": "2026-08-21" }
  ]
}
```

**API 端点设计**：

```js
// GET /api/assessment-records?action=list
// 返回学员列表索引
{
  "ok": true,
  "students": [...]
}

// GET /api/assessment-records?action=get&studentId=s_xxx
// 返回指定学员的完整档案（含全部历史记录）
{
  "ok": true,
  "student": {...}
}

// POST /api/assessment-records
// Body: { "action": "create", "name": "张三", "gender": "M", "currentGrade": "8" }
// 创建新学员档案，返回 studentId
{
  "ok": true,
  "studentId": "s_xxx"
}

// POST /api/assessment-records
// Body: { "action": "addRecord", "studentId": "s_xxx", "record": {...} }
// 给指定学员新增测评记录
{
  "ok": true,
  "recordId": "r_xxx"
}

// POST /api/assessment-records
// Body: { "action": "deleteRecord", "studentId": "s_xxx", "recordId": "r_xxx" }
// 删除指定记录
{
  "ok": true
}

// POST /api/assessment-records
// Body: { "action": "deleteStudent", "studentId": "s_xxx" }
// 删除学员档案（含全部记录）
{
  "ok": true
}
```

**实现细节**：
- 使用 Vercel KV REST API（与现有 `api/data.js` 相同模式）
- 每个学员独立 key：`assessment:student:{studentId}`
- 全局索引 key：`assessment:index`
- 每次写入学员数据时同步更新索引
- 支持 CORS（同域 manfenhu.com 前端调用）
- 错误处理：KV 不可用时返回 503，缺少参数返回 400

**验证步骤**：
1. 部署 API
2. curl POST 创建测试学员
3. curl POST 添加测评记录
4. curl GET 读回学员档案
5. 验证数据完整性
6. curl DELETE 删除测试数据

---

### 阶段 2：前端 UI - 学员档案管理入口

**目标**：在 assessment.html 页面增加"学员档案"管理入口

**改动文件**：`youth-fitness-website/public/tools/assessment.html`

**UI 设计**：

```
┌─────────────────────────────────────┐
│ 满分虎 · 成绩测评                    │
│ [📋 新建测评] [📚 学员档案]          │  ← 新增 Tab 切换
└─────────────────────────────────────┘

【Tab 1: 新建测评】（现有页面）
  基础信息
  输入测试成绩
  生成测评报告
  ↓
  [📋 复制测评报告（发微信）]
  [🖼️ 保存测评图片（发朋友圈/家长）]
  [💾 保存进学员档案]  ← 新增按钮

【Tab 2: 学员档案】（新增页面）
  ┌────────────────────────────┐
  │ [➕ 新建学员]              │
  │                            │
  │ 学员列表：                 │
  │ ┌──────────────────────┐  │
  │ │ 张三 (男 · 8年级)     │  │
  │ │ 测评3次 · 最近 08-21  │  │
  │ │ [查看档案] [删除]     │  │
  │ └──────────────────────┘  │
  │                            │
  │ ┌──────────────────────┐  │
  │ │ 李四 (女 · 6年级)     │  │
  │ │ 测评5次 · 最近 08-15  │  │
  │ │ [查看档案] [删除]     │  │
  │ └──────────────────────┘  │
  └────────────────────────────┘
```

**学员详情页（点击"查看档案"后进入）**：

```
┌─────────────────────────────────────┐
│ ← 返回列表                          │
│ 张三 (男 · 8年级)                   │
│ [➕ 新增测评记录]                   │
└─────────────────────────────────────┘

【总分成长趋势】
  (Canvas 折线图：横轴日期，纵轴总分)

【历史测评记录】
  ┌──────────────────────────┐
  │ 2026-08-21 · 89.5分 · 良好│
  │ BMI 92 · 肺活量 88 · ...  │
  │ [详情] [对比上次] [删除]  │
  └──────────────────────────┘
  
  ┌──────────────────────────┐
  │ 2026-07-15 · 86分 · 良好  │
  │ BMI 90 · 肺活量 85 · ...  │
  │ [详情] [删除]            │
  └──────────────────────────┘

【导出档案】
  [📄 导出 CSV] [🖼️ 生成成长报告图片]
```

**实现技术栈**：
- 纯前端 HTML/CSS/JS（与现有 assessment.html 一致）
- Tab 切换用 CSS `.hidden` 类控制显隐
- fetch API 调用 `/api/assessment-records`
- 总分趋势图用 Canvas 绘制折线图（参考现有柱状图/雷达图逻辑）
- CSV 导出用 Blob + download
- 成长报告图片复用现有 Canvas 绘图 + qrcode.min.js

**新增 JS 函数**：
- `loadStudentList()` - 加载学员列表
- `createStudent(name, gender, grade)` - 创建学员
- `deleteStudent(studentId)` - 删除学员
- `viewStudentDetail(studentId)` - 查看详情
- `addRecordToStudent(studentId, recordData)` - 保存当前测评到学员档案
- `renderTrendChart(records)` - 绘制总分折线图
- `exportStudentCSV(student)` - 导出 CSV
- `generateGrowthReport(student)` - 生成成长报告图片

**样式**：
- 复用现有橙色主题 `var(--brand)`
- 学员卡片用 `.card` 样式
- 按钮用 `.btn` / `.btn-ghost`
- 列表项悬停用 `hover:bg-[--brand-soft]`

---

### 阶段 3：保存当前测评到学员档案

**目标**：在测评报告生成后，点击"💾 保存进学员档案"弹窗选择学员，保存当前成绩

**交互流程**：

```
用户填写成绩 → 点击"生成测评报告"
  ↓
显示测评结果（总分/等级/图表/点评）
  ↓
用户点击"💾 保存进学员档案"
  ↓
弹窗：
  ┌────────────────────────────┐
  │ 保存到学员档案              │
  │                            │
  │ 选择学员：                 │
  │ ( ) 张三 (男 · 8年级)      │
  │ ( ) 李四 (女 · 6年级)      │
  │ ( ) ➕ 新建学员            │
  │                            │
  │ [取消] [确定保存]          │
  └────────────────────────────┘
  ↓
选择"新建学员" → 弹出输入框：
  ┌────────────────────────────┐
  │ 新建学员                   │
  │                            │
  │ 姓名：[_______]            │
  │ 性别：(•) 男  ( ) 女       │
  │ 年级：[8年级 ▼]           │
  │                            │
  │ [取消] [创建并保存]        │
  └────────────────────────────┘
  ↓
保存成功 → Toast 提示 "已保存到 张三 的档案 ✅"
```

**实现细节**：
- 弹窗用 `<div class="modal">` + CSS 遮罩层
- 学员列表从 `loadStudentList()` 加载
- 保存时调用 `addRecordToStudent(studentId, results)`
- `results` 对象包含当前测评的完整数据（来自 `computeGuoti()` / `computeXianchang()` 返回值）
- 需要补充维度数据（现有 `dimInsight()` 只返回文本，需新增 `getDimensions(r)` 返回数值）

**新增函数**：
- `showSaveToArchiveModal()` - 显示保存弹窗
- `getDimensions(r)` - 提取维度得分数值（复用 `dimInsight` 逻辑但返回对象）
- `saveToStudentArchive(studentId)` - 保存当前测评到指定学员

---

### 阶段 4：历史记录详情与对比

**目标**：点击历史记录的"详情"按钮，展示该次测评的完整报告；点击"对比上次"，展示两次成绩的差异

**详情页设计**：

```
┌─────────────────────────────────────┐
│ ← 返回                              │
│ 张三 · 2026-08-21 测评详情          │
└─────────────────────────────────────┘

【综合得分】
  89.5 分 · 良好

【单项得分对比】
  (柱状图，复用现有 renderBar 逻辑)

【雷达图】
  (复用现有 renderRadar 逻辑)

【专业点评】
  (复用现有 renderDesc 逻辑)
```

**对比页设计**：

```
┌─────────────────────────────────────┐
│ ← 返回                              │
│ 张三 · 成绩对比                     │
│ 2026-07-15 → 2026-08-21             │
└─────────────────────────────────────┘

【总分变化】
  86 分 → 89.5 分  (+3.5 ↑)

【单项变化】
  BMI:      90 → 92  (+2 ↑)
  肺活量:   85 → 88  (+3 ↑)
  50米跑:   90 → 90  (持平 →)
  体前屈:   88 → 85  (-3 ↓)
  ...

【维度雷达图对比】
  (两个雷达图叠加，或左右并排)

【进步点评】
  本次测评相比上次（07-15）：
  - 总分提升 3.5 分，从"良好"维持在"良好"
  - 心肺耐力（肺活量）进步明显，+3分
  - 柔韧性（体前屈）略有下降，-3分，建议加强拉伸
```

**实现细节**：
- 详情页直接复用现有 `renderBar` / `renderRadar` / `renderDesc`，但数据源从历史记录读取
- 对比页需要新函数 `renderComparison(record1, record2)`
- 进步/退步用箭头图标 + 颜色区分（绿色 ↑ / 红色 ↓ / 灰色 →）
- 雷达图叠加：两条折线用不同颜色（蓝色 vs 橙色）

---

### 阶段 5：导出功能

#### 5.1 导出学员 CSV

**格式**：

```csv
学员姓名,性别,年级,测评日期,总分,等级,BMI,肺活量,坐位体前屈,50米跑,一分钟跳绳,一分钟仰卧起坐,速度,耐力,力量,柔韧,协调,心肺,体态
张三,男,8,2026-08-21,89.5,良好,92,88,92,90,85,88,90,82,88,92,85,88,92
张三,男,8,2026-07-15,86,良好,90,85,90,90,80,85,90,80,85,90,80,85,90
```

**实现**：
```js
function exportStudentCSV(student) {
  const headers = ['学员姓名','性别','年级','测评日期','总分','等级'];
  const itemKeys = ['bmi','vital','sitreach','run50','rope','situp']; // 根据实际项目扩展
  const dimKeys = ['速度','耐力','力量','柔韧','协调','心肺','体态'];
  headers.push(...itemKeys.map(k => getItemName(k)));
  headers.push(...dimKeys);
  
  const rows = [headers];
  student.records.forEach(r => {
    const row = [
      student.name,
      r.gender === 'M' ? '男' : '女',
      r.grade + '年级',
      r.date,
      r.total,
      r.level
    ];
    itemKeys.forEach(k => row.push(r.scores[k]?.score || ''));
    dimKeys.forEach(d => row.push(r.dimensions[d] || ''));
    rows.push(row);
  });
  
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = student.name + '_成长档案.csv';
  a.click();
  URL.revokeObjectURL(url);
}
```

#### 5.2 生成成长报告图片

**设计**（1080px 宽 Canvas）：

```
┌────────────────────────────────────┐
│ [满分虎 LOGO] 学员成长档案         │  ← 顶部品牌区（橙色渐变）
│ 专注青少年体质提升                 │
├────────────────────────────────────┤
│ 学员：张三  性别：男  年级：8年级  │  ← 基本信息
├────────────────────────────────────┤
│ 总分成长趋势                       │
│ [折线图：07-01 → 08-21]            │  ← 总分曲线
├────────────────────────────────────┤
│ 最新测评 (2026-08-21)              │
│ 总分：89.5 分 · 等级：良好          │
│ [雷达图]                           │  ← 维度雷达图
├────────────────────────────────────┤
│ 单项得分                           │
│ BMI 92分 ━━━━━━━━━━ 92%           │  ← 得分条
│ 肺活量 88分 ━━━━━━━━━ 88%         │
│ ...                                │
├────────────────────────────────────┤
│ [二维码]  满分虎 · 青少年体能      │  ← 底部引流
│ 扫码获取专业提升方案               │
│ www.manfenhu.com                   │
└────────────────────────────────────┘
```

**实现**：
```js
function generateGrowthReport(student) {
  const W = 1080, H = 1800; // 动态高度按记录数计算
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  // 1. 顶部品牌区（复用现有 generateImage 逻辑）
  // 2. 基本信息条
  // 3. 总分趋势折线图（新增 drawTrendLine 函数）
  // 4. 最新测评雷达图（复用现有雷达图逻辑）
  // 5. 单项得分条（复用现有得分条逻辑）
  // 6. 底部二维码（复用 qrcode.min.js）
  
  const url = canvas.toDataURL('image/png');
  showImage(url, student.name + ' 成长档案');
}
```

---

### 阶段 6：全体学员导出（批量）

**目标**：在学员列表页增加"📊 导出全体成绩表"按钮，生成包含所有学员最新测评成绩的 Excel/CSV

**格式**：

```csv
学员姓名,性别,年级,最新测评日期,测评次数,最新总分,最新等级,BMI,肺活量,50米跑,...
张三,男,8,2026-08-21,3,89.5,良好,92,88,90,...
李四,女,6,2026-08-15,5,85,良好,90,85,88,...
```

**实现**：
```js
function exportAllStudentsCSV() {
  const students = await fetch('/api/assessment-records?action=list').then(r => r.json());
  const headers = ['学员姓名','性别','年级','最新测评日期','测评次数','最新总分','最新等级'];
  // ... 同上 CSV 导出逻辑
}
```

---

## 技术栈与依赖

**现有依赖（无需新增）**：
- Vercel (部署平台)
- Vercel KV / Upstash Redis (已配置环境变量)
- qrcode.min.js (已引入)
- Astro (现有项目框架)

**新增代码文件**：
- `api/assessment-records.js` (后端 API)
- `public/tools/assessment.html` (前端改造)

**无需额外安装包**：纯前端 + Serverless API，无需 npm install

---

## 实施顺序（推荐严格按序）

1. **阶段 0**：验证 KV 可用性（15 分钟）
2. **阶段 1**：实现后端 API（60 分钟）
3. **阶段 2**：前端增加学员列表 UI（90 分钟）
4. **阶段 3**：保存当前测评到档案（45 分钟）
5. **阶段 4**：历史记录详情与对比（60 分钟）
6. **阶段 5**：导出功能（60 分钟）
7. **阶段 6**：全体学员导出（30 分钟）

**总估时**：约 6 小时（纯开发时间）

---

## 验收标准

### 阶段 0
- [ ] 用 curl 成功写入和读回测试数据
- [ ] Vercel 重新部署后数据仍在

### 阶段 1
- [ ] API 端点全部实现并返回正确 JSON
- [ ] 创建学员成功
- [ ] 添加测评记录成功
- [ ] 读取学员档案包含全部历史记录
- [ ] 删除学员/记录成功

### 阶段 2
- [ ] 学员列表正常显示
- [ ] 新建学员功能正常
- [ ] 点击"查看档案"进入详情页
- [ ] 删除学员功能正常（含二次确认）

### 阶段 3
- [ ] 测评报告生成后出现"💾 保存进学员档案"按钮
- [ ] 点击后弹窗显示学员列表
- [ ] 选择学员后成功保存
- [ ] 新建学员后立即保存当前测评
- [ ] Toast 提示保存成功

### 阶段 4
- [ ] 历史记录"详情"按钮展示该次测评的完整报告
- [ ] "对比上次"按钮展示两次成绩差异
- [ ] 进步/退步用箭头和颜色标识
- [ ] 雷达图叠加对比正常

### 阶段 5
- [ ] 导出学员 CSV 包含完整历史记录
- [ ] CSV 用 Excel 打开正常（含 BOM）
- [ ] 生成成长报告图片包含：品牌/趋势图/雷达图/得分条/二维码
- [ ] 长按保存图片正常

### 阶段 6
- [ ] 导出全体学员 CSV 包含所有学员最新成绩
- [ ] CSV 格式正确，Excel 可正常打开

---

## 风险与备选方案

### 风险 1：KV 环境变量未配置
**备选**：
- 先到 Vercel 控制台 → Storage → Create KV Database
- 复制 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`
- 添加到 Environment Variables

### 风险 2：KV 容量不足
**备选**：
- Vercel KV 免费额度：256MB + 3000 次/月读写
- 如果超额，升级到 Pro 计划（$20/月）
- 或迁移到 Upstash Redis 免费额度（10000 次/天）

### 风险 3：前端代码过大导致 assessment.html 难维护
**备选**：
- 拆分为独立页面：`assessment-archive.html`（档案管理）
- 主测评页只保留"保存到档案"按钮
- 档案管理功能独立成新页面

### 风险 4：并发更新导致数据覆盖
**备选**：
- 第一版容忍（单人使用无并发）
- 第二版增加乐观锁：保存时检查 `lastUpdated` 时间戳

---

## 第二版功能（本次不做）

- [ ] 管理员登录（密码保护）
- [ ] API Token 认证
- [ ] 学员姓名脱敏（非管理员不可见）
- [ ] 数据备份功能（导出全库 JSON）
- [ ] 批量导入学员（CSV → 创建多个学员）
- [ ] 学员头像上传
- [ ] 测评提醒（距离上次测评超过 N 天提示）
- [ ] 移动端优化（响应式布局）
- [ ] 多维度趋势图（单项成长曲线）

---

## 交付物清单

完成后应交付：

1. `api/assessment-records.js` (后端 API)
2. `public/tools/assessment.html` (改造后的前端)
3. git commit log（至少 6 个提交，对应 6 个阶段）
4. 线上验证截图（学员列表 + 详情页 + 对比页 + 导出 CSV）
5. 本实施计划的完成状态更新（勾选验收标准）

---

## Agent 执行指令

```bash
# 阶段 0：验证 KV
cd D:/manfenhu-website
# 创建测试 API，部署，curl 测试（具体命令见阶段 0）

# 阶段 1-6：按序实施
# 每完成一个阶段：
# 1. git add + commit（commit message 标注阶段号）
# 2. vercel --prod 部署
# 3. 浏览器验证功能
# 4. 勾选验收标准
```

---

## 实施计划版本

- **版本**：v1.0
- **创建日期**：2026-08-21
- **目标交付日期**：2026-08-22
- **负责人**：Hermes Agent (reviewer profile)
- **审核人**：满分虎创始人（用户）

---

**此计划可直接交给 Agent 执行，每个阶段均有明确的代码位置、数据结构、API 设计、验收标准。**
