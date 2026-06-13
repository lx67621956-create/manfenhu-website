# 满分虎中考体育网站 — Codex 交接文档

## 项目概述

满分虎（manfenhu.com）是北京一家青少年体能培训机构（中考体育培训）的官方网站。
目标用户：北京中小学生家长。核心业务：中考体育提分训练、少儿体能、手球培训。
联系电话：18600216289

## 本地路径

- **项目代码根目录**：`manfenhu-website/youth-fitness-website/`
- **Git 仓库根目录**：`manfenhu-website/`（包含 `.git`）
- **GitHub 远程**：`https://github.com/lx67621956-create/manfenhu-website.git`
- **线上地址**：`https://www.manfenhu.com`
- **Vercel 项目**：youth-fitness-website（rootDirectory = youth-fitness-website）

## 技术栈

| 项 | 值 |
|---|---|
| 框架 | Astro 5.7.12 |
| 输出模式 | `output: 'static'`（纯静态站） |
| 集成 | @astrojs/sitemap, @astrojs/mdx |
| 部署 | Vercel（Git Integration 自动部署） |
| 包管理 | npm（有 package-lock.json，**不要用 pnpm**） |
| 构建 | `npm run build` → 输出到 `dist/` |

## 关键文件结构

```
youth-fitness-website/
├── astro.config.mjs          # Astro 配置（static 模式）
├── vercel.json               # Vercel 配置（outputDirectory: dist）
├── package.json
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro      # 全站基础布局（header/footer/style）
│   │   └── ArticleLayout.astro  # 文章详情页布局
│   ├── pages/
│   │   ├── index.astro           # 首页
│   │   ├── contact/index.astro   # 联系页
│   │   ├── courses/              # 课程页（index + ertong/shouqiu/zhongkao 详情）
│   │   ├── news/
│   │   │   ├── index.astro       # ⚠️ 资讯列表页（硬编码 HTML 卡片，非自动发现）
│   │   │   └── *.astro           # 37 篇文章（每篇一个 .astro 文件）
│   │   ├── students/index.astro  # 学员风采（待填充）
│   │   ├── team/index.astro      # 师资团队
│   │   └── venue/index.astro     # 训练环境（待填充）
│   └── components/               # （目前无独立组件）
├── public/
│   ├── images/
│   │   ├── logo.png, wechat-qr.png
│   │   ├── courses/ (3 张课程 jpg)
│   │   ├── news/ (6 个 SVG 占位图 + 其他)
│   │   └── team/ (3 张教练照片)
│   └── styles/global.css
└── api/submit-form.js            # 联系表单 API（目前未启用）
```

## 文章系统说明

### 文章格式
每篇文章是一个独立的 `.astro` 文件，使用 JSX 属性模式（**不是** frontmatter `layout` 模式）：

```astro
---
import ArticleLayout from '@layouts/ArticleLayout.astro';

const title = '文章标题';
const description = '文章描述';
const pubDate = '2026年X月X日';
const image = '/images/xxx.jpg';  // 头图，可选
---

<ArticleLayout title={title} description={description} pubDate={pubDate} image={image}>
  <p>文章正文...</p>
  <h2>小标题</h2>
  <p>更多内容...</p>
</ArticleLayout>
```

**注意**：正文用标准 HTML 标签（`<p>` `<h2>` `<ul>` `<strong>` 等），**不要用 markdown 语法**（`#` `**` 等），因为 Astro 的 .astro 文件中 markdown 不会自动渲染。

### ⚠️ 资讯列表页是硬编码的
`src/pages/news/index.astro` 里的文章卡片是手动维护的 HTML，**不会自动发现新文章**。
新增文章必须同时：
1. 创建 `src/pages/news/xxx.astro` 文件
2. 在 `src/pages/news/index.astro` 中添加对应的 `<article class="news-card">` 卡片

### 配图现状
- 6 篇新文章（2026-06-03）使用本地 SVG 占位图（`/images/news/*.svg`），是纯色矩形+文字
- 旧文章使用 Unsplash CDN 链接（`images.unsplash.com/photo-xxx`），国内可能不稳定
- 3 个课程页使用真实 jpg 图片（`/images/courses/`）
- **待办**：为 6 篇新文章替换更贴合主题的真实配图

### 内容约束
- **禁止写具体分数标准**（如"1000米满分4分05秒"等），改为描述项目类型
- 文章每篇 500 字以上
- 北京本地内容为主，软性广告自然植入

## 当前页面统计
- 总计约 38 个页面
- 37 篇资讯文章
- 4 个课程页（列表+3个详情）
- 首页、联系页、师资、学员风采、训练环境

## 待办事项
1. [ ] 为 6 篇新文章替换 SVG 占位图为真实配图（需匹配文章主题）
2. [ ] 旧文章 Unsplash 链接如被墙也需本地化
3. [ ] 学员风采页填充真实内容
4. [ ] 训练环境页填充真实内容
5. [ ] 联系表单集成腾讯问卷（survey_id: 26539023，链接: https://wj.qq.com/s2/26539023/0ba7）
6. [ ] Vercel 部署只用 Git Integration 自动触发，**不要用 pnpm**

## 常用命令

```bash
cd youth-fitness-website

# 安装依赖
npm install

# 本地开发
npm run dev          # http://localhost:4321

# 构建
npm run build        # 输出到 dist/

# 本地预览构建结果
npm run preview

# Vercel 部署（从 manfenhu-website/ 目录执行）
vercel --prod
```

## 历史踩坑记录

1. **pnpm 冲突**：项目同时存在 package-lock.json 和 pnpm-lock.yaml 时，Vercel 会选 pnpm 导致安装失败。解决：删除 pnpm-lock.yaml，只用 npm
2. **Output Directory**：Vercel 项目设置必须为 `dist`，否则构建输出找不到
3. **Root Directory**：Vercel 项目 rootDirectory 必须为 `youth-fitness-website`
4. **node_modules 误提交**：曾误将 12,077 个 node_modules 文件 commit，需 `git rm --cached -r node_modules` 清理
5. **编码问题**：.astro 文件必须 UTF-8 编码，GBK 会导致 Astro 解析 404
6. **Git push 网络不稳定**：GitHub 连接偶尔超时，可重试或通过 Vercel CLI 直接部署
7. **PowerShell `&&`**：PowerShell 中 `&&` 可能不被正确解析，建议用分号 `;` 或 `cmd /c`
