# 小精灵打卡项目 — 优化计划

> 项目路径：`C:\Users\lx676\manfenhu-website\youth-fitness-website`
> 线上地址：`https://manfenhu.com/elf/`
> Git：`master` 分支，远程 `origin/master`
> Vercel 自动部署（push 即上线）

---

## 一、项目现状

### 1.1 代码结构

| 文件 | 大小 | 说明 |
|------|:----:|------|
| `public/elf/student.html` | **65KB** | 学生端全部代码（CSS 26KB + JS 35KB + HTML 3KB），54个函数，单文件 |
| `public/elf/admin/index.html` | **34KB** | 管理端全部代码 |
| `api/data.js` | 3KB | 数据同步 API（**内存存储，重启丢失**） |
| `public/images/pets/` | 187个GIF | 30只精灵 × 5种动作 + 杂项 |
| `public/images/ui/` | 7张 | 装饰素材（arena_bg.png 1.4MB 等） |

### 1.2 功能列表

| 功能 | 学生端 | 管理端 | 状态 |
|------|:------:|:------:|:----:|
| 登录（密码验证） | ✅ | — | 默认密码 `123456` |
| 学生管理（增删改查） | — | ✅ | 12+ 学生 |
| 打卡 | — | ✅ | 管理员操作 |
| 积分/金币调整 | — | ✅ | 💰/➕ 按钮 |
| 喂食 | ✅ | — | 消耗5金币 |
| 训练（属性增长） | ✅ | — | 消耗5金币 |
| 战斗（1v1 / 3v3） | ✅ | — | 自动匹配，伤害数字浮动 |
| 商店（8种商品） | ✅ | — | 积分兑换 |
| 图鉴（30只精灵） | ✅ | — | 已解锁/锁定 |
| 盲盒 | ✅ | — | 去重逻辑 |
| 数据同步 | ✅ | ✅ | localStorage + API 双向合并 |

### 1.3 已知问题

| 问题 | 严重度 | 说明 |
|------|:------:|------|
| **部署后数据丢失** | 🔴 P0 | API 内存存储，Vercel 重启/部署后数据清空 |
| **65KB 单文件** | 🟡 P1 | 改动任何代码风险大，CSS/JS 混在一起 |
| **GIF 体积大** | 🟡 P1 | 187个GIF未压缩，影响加载速度 |
| **宠物 #23 缺少emoji** | 🟢 P2 | `PE` 数组中 `🪨` 在老设备不显示 |
| **3个空文件** | 🟢 P2 | `header_deco.png` `star.png` 已删，代码不引用 |

---

## 二、优化路线图

```
P0 ─┬─ ① 数据持久化（Upstash Redis）
    └─ ② 代码拆分（CSS/JS 移出 HTML）
       │
P1 ─┬─ ③ 排行榜系统
    ├─ ④ 成就系统
    ├─ ⑤ 音效系统
    ├─ ⑥ 宠物图片优化（压缩/WebP）
    └─ ⑦ SenseNova U1 生成装饰素材
       │
P2 ─┬─ ⑧ 技能选择 + 属性克制（战斗增强）
    ├─ ⑨ 微信 OAuth 登录
    ├─ ⑩ PWA 离线支持
    └─ ⑪ 英文版 / 国际化
```

---

## 三、P0 — 基础架构优化

### 任务 ①：数据持久化

**现状：** 所有数据存在浏览器 `localStorage`，API 接口 `/api/data` 用内存存储。
部署新版本后 API 冷启动，旧数据全部丢失。

**方案：Upstash Redis**（免费套餐：10,000次/天，256MB）

**步骤：**

```bash
# 1. 去 https://console.upstash.com/redis 注册，创建 Redis 数据库
#    选择 Vercel 集成或手动获取 KV_REST_API_URL / KV_REST_API_TOKEN

# 2. 在 Vercel 项目设置中添加环境变量：
#    KV_REST_API_URL = https://<your-region>.upstash.io
#    KV_REST_API_TOKEN = <your-token>

# 3. 重新部署，验证数据持久化
```

**现有代码：** `api/data.js` 已经包含 `kvGet()` 和 `kvSet()` 函数，配好环境变量即可工作。

**验证方法：**
1. 打开学生端/管理端，确保数据正常
2. 在 Vercel 强行触发一次新部署（push 空 commit）
3. 部署完成后刷新页面，**数据应该还在**

---

### 任务 ②：代码拆分

**现状：** student.html 单文件 65KB，CSS + JS + HTML 全部内联，难以维护。

**目标：** 拆为 3 个文件

```
public/elf/
├── student.html     → 仅 HTML 结构（~3KB）
├── student.css      → 全部样式（~26KB）
└── student.js       → 全部逻辑（~35KB）
```

**步骤：**

```bash
# 1. 从 student.html 中提取 <style> 内容到 public/elf/student.css
# 2. 从 student.html 中提取 <script> 内容到 public/elf/student.js
# 3. 在 student.html 的 <head> 中引用 CSS：
#      <link rel="stylesheet" href="/elf/student.css">
# 4. 在 student.html 的 </body> 前引用 JS：
#      <script src="/elf/student.js"></script>
# 5. 验证所有功能正常
```

**注意事项：**
- Astro 静态目录 `public/` 下的文件直接可访问，不需要额外配置
- 图片路径是绝对路径 `/images/...` 不受影响
- 管理端 `admin/index.html` 要不要拆分？建议等 student.html 验证稳定后再做

---

## 四、P1 — 功能增强

### 任务 ③：排行榜

**位置：** 学生端底部导航新增「排行榜」tab

**功能：**

| 排行维度 | 排序依据 | 说明 |
|----------|:--------:|------|
| 积分榜 | 总积分 | 全班学生按积分降序 |
| 精灵榜 | 精灵数量 | 按已解锁精灵数降序 |
| 战斗榜 | 胜场数 | 按战斗记录中胜场数降序 |

**UI 建议：**
```
┌─────────────────────┐
│  🏆 排行榜           │
│                     │
│  🥇 老徐  30000 积分 │
│  🥈 老六  9527  积分 │
│  🥉 老胡  3022  积分 │
│  4  猴子  3000  积分 │
│  5  杰伦  3000  积分 │
│  ...                │
│                     │
│ [积分榜][精灵榜][战斗] │
└─────────────────────┘
```

**技术实现：**
- 新增页面 `pageRank` 和对应的 `rRank()` 渲染函数
- 从 `st.people` 数据中提取各维度进行排序
- 使用 `localStorage.getItem('checkin_pets')` + `syncAPI()` 获取最新数据

---

### 任务 ④：成就系统

**位置：** 首页/个人页面底部，或排行榜页面内的成就版块

**成就列表：**

| 成就 | 条件 | 图标 |
|------|------|:----:|
| 初来乍到 | 首次登录 | 🌱 |
| 打卡达人 | 打卡 10 次 | 📅 |
| 打卡大师 | 打卡 50 次 | 🏅 |
| 第一场战斗 | 完成首次对战 | ⚔️ |
| 常胜将军 | 战斗胜利 10 场 | 🏆 |
| 收藏家 | 解锁 10 只精灵 | 📖 |
| 精灵大师 | 集齐全部 30 只精灵 | 👑 |
| 富甲一方 | 积攒 10000 积分 | 💰 |
| 训练师 | 训练 50 次 | 🧪 |

**技术实现：**
- 定义成就配置数组 `ACHIEVEMENTS`
- 新增 `checkAchievements(n)` 函数，在关键操作后检查解锁
- 已解锁成就存到 `st.people[n].achievements` 数组
- 在首页底部展示成就徽章墙

---

### 任务 ⑤：音效系统

**技术方案：** Web Audio API + Base64 编码短音效（无需加载外部文件）

**需要的音效：**

| 场景 | 音效 | 触发点 |
|------|:----:|--------|
| 登录成功 | 上升音 | `login()` 成功后 |
| 按钮点击 | 轻触音 | 所有按钮点击时 |
| 喂食 | 咀嚼音 | `fdAct()` |
| 训练 | 升级音 | `cL()` 升级时 |
| 战斗攻击 | 打击音 | `rBattleStep()` 每次攻击 |
| 战斗暴击 | 重击音 | 暴击时 |
| 战斗胜利 | 胜利音 | `showBattleResult()` |
| 战斗失败 | 失败音 | 失败时 |
| 打开盲盒 | 惊喜音 | 盲盒打开时 |
| 解锁成就 | 成就音 | 新成就达成时 |

**简易实现（示例）：**
```javascript
// 使用 AudioContext 生成简单音效，无需外部文件
function playSound(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  switch(type) {
    case 'click': 
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start(); osc.stop(ctx.currentTime + 0.05);
      break;
    case 'win':
      osc.frequency.value = 523;
      gain.gain.value = 0.15;
      osc.start(); 
      osc.frequency.linearRampToValueAtTime(784, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
      break;
    // ... 更多音效
  }
}
```

---

### 任务 ⑥：宠物图片优化

**现状：** 187 个 GIF 文件，共约 XX MB，直接引用未压缩。

**优化方案：**

| 措施 | 效果 | 工作量 |
|------|:----:|:------:|
| GIF 压缩（gifsicle） | 体积减少 40-60% | 中 |
| 懒加载 | 只加载可见范围的 GIF | 小 |
| 首屏预加载 | 优先加载前 5 只精灵 | 小 |
| CDN 缓存 | Vercel Edge Cache | 零 |

---

### 任务 ⑦：SenseNova U1 生成装饰素材

**API 信息：**

| 参数 | 值 |
|------|------|
| Endpoint | `POST https://token.sensenova.cn/v1/images/generations` |
| 认证 | `Authorization: Bearer <KEY>` |
| 模型 | `sensenova-u1-fast` |
| 推荐尺寸 | `2048x2048` |
| KEY 位置 | `C:\Users\lx676\manfenhu-website\sn_key.txt` |

**可生成的素材：**

| 素材 | 用途 | Prompt 方向 |
|------|:----:|-------------|
| 精灵球图标 | 登录页 | "Pokeball icon, simple vector, red and white, clean" |
| 星级装饰 | 首页星星 | "Golden star sparkle decoration, transparent background" |
| 战斗背景图 | 比武场 | "Dragon Ball style tournament arena, white circular stage on grass, blue sky, anime style" |
| 奖杯图标 | 排行榜 | "Golden trophy cup icon, simple vector" |
| 成就徽章 | 成就系统 | 各种成就对应的图标徽章 |

**调用示例（Python）：**
```python
import urllib.request, json

url = "https://token.sensenova.cn/v1/images/generations"
payload = json.dumps({
    "model": "sensenova-u1-fast",
    "prompt": "your prompt here",
    "n": 1,
    "size": "2048x2048"
}).encode()

req = urllib.request.Request(url, data=payload)
req.add_header("Authorization", "Bearer <KEY>")
req.add_header("Content-Type", "application/json")

resp = urllib.request.urlopen(req, timeout=120)
result = json.loads(resp.read())
img_url = result["data"][0]["url"]
```

---

## 五、技术参考

### 5.1 关键代码索引（student.html）

| 函数 | 行号（约） | 说明 |
|------|:----------:|------|
| `initSt()` | JS:1 | 初始化数据（localStorage + API 同步） |
| `syncAPI()` | JS:40 | 从服务器拉取数据 |
| `mergeWithAPI()` | JS:60 | 字段级智能合并 |
| `apiSv()` | JS:100 | 推送数据到服务器（debounce 200ms） |
| `login()` | JS:110 | 登录验证 |
| `rHome()` | JS:120 | 首页渲染 |
| `rBat()` | JS:155 | 战斗入口 |
| `rBattleLoop()` | JS:170 | 战斗循环 |
| `rBattleStep()` | JS:175 | 战斗单步 |
| `showBattleResult()` | JS:180 | 战斗结果展示 |
| `rShop()` | JS:185 | 商店渲染 |
| `rColl()` | JS:190 | 图鉴渲染 |
| `rPet()` | JS:140 | 精灵详情渲染 |
| `showDmg()` | JS:165 | 伤害数字浮动 |
| `showPg()` | JS:130 | 页面切换 |

### 5.2 数据结构

```javascript
// 一个学生的数据
{
  points: 0,            // 积分/金币
  totalCheckins: 0,     // 总打卡次数
  currentPetIdx: 0,     // 当前选中的精灵索引
  petSlots: [0],        // 已解锁的精灵ID数组
  petLevels: [1],       // 对应等级
  petXP: [0],           // 对应经验值
  statBonus: [{hp:0,atk:0,def:0,spd:0,int:0,luk:0}], // 属性加成
  hunger: 80,           // 饱食度
  happiness: 80,        // 心情
  lastTimestamp: 0,     // 最后操作时间戳
  password: "123456",   // 密码
  battlesToday: 0,      // 今日已战斗次数
  battleDate: "",       // 战斗日期
  pendingBoxes: [],     // 待打开盲盒
  battleHistory: [],    // 战斗记录
  achievements: []      // 【待添加】已解锁成就
}
```

### 5.3 环境变量

| 变量 | 用途 | 现状 |
|------|------|:----:|
| `KV_REST_API_URL` | Upstash Redis URL | ❌ 未配置 |
| `KV_REST_API_TOKEN` | Upstash Redis Token | ❌ 未配置 |
| `SN_API_KEY` | SenseNova API Key | ✅ 存于 `sn_key.txt` |

### 5.4 部署

```bash
# 推送即部署
git add -A
git commit -m "描述修改内容"
git push
# Vercel 自动部署完成 ✅
```

---

## 六、团队协作规范

### 6.1 开发流程

```
需求 → CEO 规划 → 派给 Developer → 开发 → 派给 Tester 测试 → 派给 Reviewer 审查 → 部署 → 验证
```

每项任务必须经过 **Dev → Test → Review** 完整循环。CEO 不能跳过团队自己做开发。

### 6.2 质量标准

- ✅ Console 0 错误
- ✅ 端到端测试（admin 加人 → API 验证 → 学生登录 → 功能验证）
- ✅ 不破坏已有功能（"先确保已有的功能是好的"）
- ✅ 所有页面外框一致、padding 一致
- ✅ 手机端（420px 宽度）布局正常

### 6.3 Git 约定

```bash
分支: master（直接推送，Vercel 自动部署）
提交格式: fix: 简短描述    # bug修复
           feat: 简短描述   # 新功能
           perf: 简短描述   # 性能优化
           refactor: 简短描述 # 重构
```
