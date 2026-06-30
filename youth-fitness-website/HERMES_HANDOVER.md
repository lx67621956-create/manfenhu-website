# 满分虎（manfenhu.com）项目维护手册

> 本文档面向接手此项目的 AI Agent（Hermes），所有操作均为命令行执行，无图形界面。

---

## 项目基本信息

| 项目 | 内容 |
|------|------|
| 网站 | `www.manfenhu.com` |
| 源码路径 | `C:\Users\lx676\manfenhu-website\youth-fitness-website` |
| GitHub | `https://github.com/lx67621956-create/manfenhu-website` |
| Git 仓库目录 | `youth-fitness-website/` |
| 技术栈 | Astro 5.7.12 + Vercel 静态部署 |
| Vercel 项目 | `gs-projects-f890d2b9/youth-fitness-website` |
| 文章数量 | 68篇（位于 `src/pages/news/*.astro`） |
| 构建命令 | `npm run build` |
| 本地 Node | v22.22.3 |

---

## 核心工作流

### 1. 构建

> ⚠️ PowerShell 的 `npm run build` 会报 `此时不应有 )` 错误，用 Python 脚本或 `.bat` 文件绕过。

**方法 A（推荐）：用 Python 脚本构建**
```python
# 在项目目录创建 build_runner.py
import subprocess, os
proj = r"C:\Users\lx676\manfenhu-website\youth-fitness-website"
npm = r"D:\QClaw\v0.2.28.587\resources\openclaw\config\bin\node\npm.cmd"
subprocess.run([npm, "run", "build"], cwd=proj)
```
执行：`py -3 build_runner.py`

**方法 B：用 .bat 文件构建**
```batch
@echo off
cd /d C:\Users\lx676\manfenhu-website\youth-fitness-website
npm run build
```
直接运行 `build.bat` 或在 cmd 中执行。

**方法 C：用 cmd /c 运行**
```cmd
cmd /c "cd /d C:\Users\lx676\manfenhu-website\youth-fitness-website && npm run build"
```

---

### 2. Git 提交

> ⚠️ Git 在 PowerShell 中也有编码问题，同样用 Python 脚本绕过。

**提交单个文件的 Python 脚本（git_push.py）：**
```python
import subprocess, os
proj = r"C:\Users\lx676\manfenhu-website\youth-fitness-website"
git = r"D:\APP MAKER\Git\cmd\git.exe"
os.chdir(proj)

cmds = [
    [git, "add", "src/layouts/ArticleLayout.astro"],
    [git, "commit", "-m", "fix: 你的提交信息"],
    [git, "push", "origin", "master"],
]
for cmd in cmds:
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout, r.stderr, r.returncode)
```

---

### 3. Vercel 部署

**方式 A（推荐）：从父目录手动部署（绕过 rootDirectory 问题）**
```cmd
cd C:\Users\lx676\manfenhu-website
vercel --prod --yes
```

**方式 B：GitHub 自动部署**
推送 GitHub 后 Vercel 会自动触发，但有时因 rootDirectory 配置问题会跳过。

---

## 文章系统

### 文章文件位置
`src/pages/news/[slug].astro`

### 文章模板格式

```astro
---
import ArticleLayout from '@layouts/ArticleLayout.astro';

export const title = '文章标题';
export const date = '2026-06-17';          // 发布日期（自动显示在页面顶部）
export const coverImage = '/images/news/图片名.jpg';  // 配图（可选）
---

<ArticleLayout {title} {date} {coverImage}>

<!-- 文章正文（HTML 标签，不含 Markdown 语法） -->
<h2>章节标题</h2>
<p>正文内容...</p>

</ArticleLayout>
```

### ⚠️ 关键规范

1. **正文必须用 HTML 标签**（`<h2>`, `<p>`, `<strong>`, `<ul>`, `<li>` 等），不能用 Markdown 语法（`##`, `**`, `- `）。ArticleLayout 不会渲染 Markdown。

2. **ArticleLayout Props 支持两种命名**（已兼容）：
   - `date` / `coverImage`（推荐）
   - `pubDate` / `image`（旧格式，也支持）
   两者选一种即可，不要混用。

3. **添加文章后必须**：
   - 放到 `src/pages/news/` 目录
   - 在 `src/pages/news/index.astro` 的新闻列表 HTML 中添加对应的卡片
   - 生成或添加对应配图到 `public/images/news/`
   - 运行构建确认无误
   - Git 提交 + Vercel 部署

### 新闻列表页维护
`src/pages/news/index.astro` 是硬编码的 HTML 列表，每篇新闻需要手动添加一个卡片，格式：
```html
<article>
  <time datetime="2026-06-17">2026年6月17日</time>
  <h2><a href="/news/slug">文章标题</a></h2>
  <p>摘要...</p>
</article>
```

### 分页
当前设置为每页 10 篇，共 6 页（56篇）。如需修改，在 `index.astro` 中搜索 `PER_PAGE`。

---

## 图片系统

### 图片目录
`public/images/news/`

### 图片 API（GPT88）
- **端点**: `https://img.gpt88.cc/v1`
- **模型**: `gpt-image-2`
- **认证**: Bearer Token
- **返回格式**: `b64_json`（需 base64 解码后保存为 .jpg 文件）

### 生图脚本（gen_gpt88.py）
```python
import httpx, base64, json, time
from PIL import Image
import io

API_URL = "https://img.gpt88.cc/v1/images/generations"
TOKEN = "Bearer 你的Token"  # 找用户获取

def generate(prompt, out_path):
    payload = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "response_format": "b64_json"
    }
    headers = {"Authorization": TOKEN, "Content-Type": "application/json"}
    
    for attempt in range(4):
        try:
            resp = httpx.post(API_URL, json=payload, headers=headers, timeout=120)
            data = resp.json()
            b64 = data["data"][0]["b64_json"]
            img_data = base64.b64decode(b64)
            
            # 后处理：缩放+高斯模糊+JPEG压缩
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            w, h = img.size
            new_w = 1200
            new_h = int(h * new_w / w)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            from PIL import ImageFilter
            img = img.filter(ImageFilter.GaussianBlur(radius=1.0))
            img.save(out_path, "JPEG", quality=85, optimize=True)
            print(f"OK: {out_path}")
            return True
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}")
            time.sleep(10)
    return False
```

### 人物图片提示词规范
- 必须指定 **East Asian Chinese** 面孔
- 教练图：侧后方，不露正脸
- 学生图：禁止出现校徽
- 所有图片统一后处理：1200px 宽 + 高斯模糊 radius=1.0 + JPEG 85%

---

## Vercel 配置

| 配置项 | 值 |
|--------|-----|
| 项目 ID | `prj_zVkz4sHksbR6BwYJZGXHenkyXkJR` |
| 团队 ID | `team_zWxSgetEY9HQgxezhVmHfCQw` |
| rootDirectory | `youth-fitness-website` |
| Node.js 版本 | **24.x**（必须！20.x 已废弃，2026-10-01 后无法构建）|
| 部署命令 | `npm run build` |
| 输出目录 | `dist/` |

**查看/修改 Node.js 版本**（命令行）：
```cmd
vercel project list
vercel project update youth-fitness-website --help  # 查看命令（目前 CLI 不支持直接改 Node 版本）
```
建议直接去网页改：https://vercel.com/gs-projects-f890d2b9/youth-fitness-website/settings/general

---

## 域名与 DNS

- 自定义域名：`www.manfenhu.com`
- DNS 配置：阿里云，CNAME 指向 `cname.vercel-dns.com`
- Vercel 自动管理 SSL

---

## 常见问题与解决方案

### Q: `此时不应有 )` npm/node 命令报错
A: PowerShell 环境注入问题。所有 npm/node 命令用 Python subprocess 或 .bat 文件调用。

### Q: 图片不显示
A: 检查文章是否传了 `coverImage` 或 `image` prop，路径是否为 `/images/news/xxx.jpg`，且图片文件存在于 `public/images/news/`。

### Q: 文章内容显示原始 Markdown 符号（`##` / `**`）
A: 正文必须用 HTML 标签，不能用 Markdown 语法。检查文章文件里的正文部分。

### Q: Vercel 部署没触发
A: Git 推送后 Vercel 有时会因 rootDirectory 路径匹配问题跳过自动部署。手动执行 `vercel --prod --yes`（从 `C:\Users\lx676\manfenhu-website` 目录运行）。

### Q: Git push 失败（rejected）
A: 远程有更新，先 pull 再 push：`git pull origin master --rebase` 或 `git stash` → `git pull` → `git stash pop`。

### Q: 生图 API 超时
A: gpt88.cc 有时不稳定，增加 timeout 到 120s，重试 3-4 次。

---

## 紧急修复流程

发现问题 → 定位文件 → 修改 → 构建 → git commit → vercel --prod

全程无需停机，Vercel 部署完成后自动切换流量。

---

## 待办事项（当前）

- 56篇文章已全部有配图，文章系统正常运行
- 持续发布知乎内容（gothic-87 账号）
- 考虑更多引流文章主题
