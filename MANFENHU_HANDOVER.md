# 满分虎（manfenhu.com）项目交接文档

**创建时间**：2026-06-17  
**交接对象**：Hermes Agent  
**当前维护**：迪丽锅巴（OpenClaw Agent）

---

## 一、项目概述

**网站**：`www.manfenhu.com`  
**用途**：中考体育培训内容网站 + 知乎内容分发  
**技术栈**：Astro 5.7.12 + @astrojs/vercel 9，静态站点模式  
**部署平台**：Vercel  
**代码仓库**：GitHub

---

## 二、服务器与部署

### Vercel 配置

- **部署平台**：Vercel (vercel.com)
- **项目名**：`manfenhu-website`（生产） / `youth-fitness-website`（本地文件夹名）
- **部署方式**：Git Integration（GitHub推送自动部署）
- **Root Directory**：`youth-fitness-website`（Vercel项目设置中配置）
- **手动部署命令**：`vercel --prod`（在项目根目录执行）
- **生产URL**：`https://www.manfenhu.com`
- **Vercel默认域名**：`https://youth-fitness-website-ba1g39mg6-gs-projects-f890d2b9.vercel.app`

### 已知问题

- **自动部署可能失效**：Vercel的Git Integration有时不触发，需手动执行 `vercel --prod`
- **Root Directory配置**：确保Vercel项目设置中`rootDirectory=youth-fitness-website`，否则构建路径错误
- **存储限额**：Vercel Hobby计划100MB，需定期清理PNG，使用JPG压缩（85%质量，最大1200px宽）

---

## 三、GitHub 仓库

- **仓库名**：`manfenhu-website/youth-fitness-website`（本地文件夹名与GitHub仓库名不同）
- **分支**：`master`
- **最新commit**：`95f0036`（2026-06-17 14:44）
- **自动部署**：push到master分支后，Vercel自动构建（如失效则手动部署）

### 本地项目路径

```
C:\Users\lx676\manfenhu-website\youth-fitness-website\
```

（注：用户本地路径，Hermes需确认自己的本地路径）

---

## 四、域名与DNS

- **主域名**：`www.manfenhu.com`
- **DNS解析**：通过Vercel管理（域名绑定在Vercel项目中配置）
- **SSL证书**：Vercel自动提供Let's Encrypt证书

**操作入口**：Vercel项目 → Settings → Domains

---

## 五、API密钥与第三方服务

### 图片生成API

- **端点**：`https://aiapi.up.railway.app/v1`
- **认证**：Bearer Token（存储在OpenClaw环境变量或脚本中）
- **可用模型**：`gpt-image-2`、`gemini-3-pro-image-preview`
- **返回格式**：`b64_json`（需解码保存为JPG）
- **稳定性**：已知不稳定，可能返回503/超时，需多次重试

### Token存储位置

**重要**：Token不应明文存储在代码中。当前可能在以下位置：
- `scripts/gen_images.py` 或类似脚本中
- OpenClaw环境变量
- **建议**：Hermes接手后，将Token移至Vercel环境变量或GitHub Secrets

---

## 六、网站结构

### 目录结构

```
youth-fitness-website/
├── public/
│   ├── images/
│   │   ├── news/          # 文章配图（AI生成JPG）
│   │   └── placeholder.svg # SVG占位图
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── ArticleLayout.astro  # 文章布局组件
│   ├── pages/
│   │   ├── index.astro          # 首页
│   │   ├── news/
│   │   │   ├── index.astro      # 新闻列表页（手动维护HTML卡片）
│   │   │   └── *.astro          # 37篇新闻文章
│   │   ├── courses/
│   │   ├── contact.astro
│   │   └── students.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── styles/
├── package.json
├── astro.config.mjs
└── vercel.json
```

### 文章系统

- **文章数量**：47篇（2026-06-17统计）
- **文章路径**：`src/pages/news/*.astro`
- **文章模板**：必须使用JSX组件格式 + `import ArticleLayout from '@layouts/ArticleLayout.astro'`
- **禁止**：使用frontmatter `layout`模式（会触发esbuild错误）
- **列表页**：`src/pages/news/index.astro` 手动维护HTML卡片（不支持自动发现）

### 新增文章流程

1. 创建 `src/pages/news/xxx.astro`（复制现有文章模板）
2. 创建配图 `public/images/news/xxx.jpg`（AI生成或SVG占位）
3. 更新 `src/pages/news/index.astro` 添加文章卡片
4. `git add . && git commit -m "新增文章：xxx" && git push`
5. 等待Vercel自动部署（或手动 `vercel --prod`）

---

## 七、知乎内容分发

### 已完成的知乎回答

存储在 `manfenhu-website/zhihu-answers/` 目录：

1. `zhongkao-life-decider-2026.md` — 中考是否决定人生
2. `zhongkao-200days-2026.md` — 200天拼命还有用吗
3. `zhongkao-fail-choice-2026.md` — 技校还是私立高中
4. `archery-pressure-2026.md` — 射箭心理压力
5. 女生50米（未存文件，已交付文字版）
6. 中考前10天没动力（未存文件，已交付文字版）

### 知乎账号

- **账号名**：`gothic-87`（用户提供的知乎账号）
- **发布状态**：全部未发布（等待用户手动发布）
- **建议发布频率**：每天1篇，早上9-10点

---

## 八、关键决策与约束

### 硬约束

1. **成绩标准删除**（2026-05-11）：所有文章禁止写具体分数/时间/个数，用项目类型描述替代
2. **图片来源**：AI生成（GPT-Image-2）+ 高斯模糊滤镜（radius=1.0）去AI感
3. **营销定位**：强调"有用、高效、提升明显"，避免"便宜""性价比"
4. **班级人数**：统一8-10人
5. **人物形象**：所有人物图片必须为"East Asian Chinese"，教练图侧后方不露正脸，学生图禁止校徽

### 避坑记录

1. **Vercel双项目问题**：本地文件夹名 ≠ Vercel项目名，需配置`rootDirectory`
2. **esbuild解析错误**：frontmatter中文标点可能触发错误，`description`须加双引号
3. **API返回格式**：图片API返回`b64_json`而非URL，需解码保存
4. **用户缓存**：新版内容上线后，用户需强制刷新（Ctrl+Shift+R）

---

## 九、待办事项

### 短期（本周）

- [ ] 发布知乎回答（每天1篇）
- [ ] 观察网站流量与SEO效果
- [ ] 考虑生成更多文章（Q11-Q20清单未完成）

### 中期（本月）

- [ ] 考虑其他内容分发平台（小红书/公众号）
- [ ] 打包PDF文集（中考体育备考指南）
- [ ] 优化图片加载速度（Lazy Load / WebP格式）

### 长期

- [ ] 考虑引入CMS系统（减少手动维护）
- [ ] 增加用户互动功能（评论/问答）
- [ ] 考虑多语言版本

---

## 十、联系方式与账号

### 用户账号

- **知乎账号**：`gothic-87`
- **GitHub账号**：（需用户确认）
- **Vercel账号**：（需用户确认）

### Agent联系方式

- **当前维护Agent**：迪丽锅巴（OpenClaw，agent-c6cfa962）
- **交接后维护Agent**：Hermes

---

## 十一、紧急修复指南

### 网站打不开

1. 检查Vercel部署状态：https://vercel.com/dashboard
2. 查看构建日志，确认是否有错误
3. 如构建失败，手动部署：`vercel --prod`

### 图片不显示

1. 检查图片路径是否正确（`public/images/news/xxx.jpg`）
2. 确认图片文件已提交到GitHub
3. 强制刷新浏览器缓存（Ctrl+Shift+R）

### 新文章不显示

1. 确认 `src/pages/news/index.astro` 已添加文章卡片
2. 确认构建成功（Vercel日志显示47 pages）
3. 等待DNS传播（最多24小时）

---

## 十二、附录：常用命令

```bash
# 本地开发
cd manfenhu-website/youth-fitness-website
npm run dev

# 构建
npm run build

# Git推送
git add .
git commit -m "描述"
git push origin master

# 手动部署到Vercel
vercel --prod

# 查看Vercel部署日志
vercel logs

# 生成文章配图（示例脚本）
python scripts/gen_10images.py
```

---

**文档结束**

**最后更新**：2026-06-17 18:45  
**下次审查**：2026-07-01
