# 月相记录 · Persona 3 风格个人博客

一个纯静态的个人博客，视觉语言取自《女神异闻录3》与其重制版：蓝色与水、水下浮游的焦散光、斜切面板、月相进度，以及 MEMENTO MORI。

产物全部落在 `docs/`，可以直接作为 GitHub Pages 的发布目录；也附带一个 GitHub Actions 工作流做自动构建。

## 先看哪条命令

```bash
npm install     # 装依赖（marked + gray-matter）
npm run dev     # 本地开发 http://localhost:4321，改 md/css/js 自动重建并刷新
npm run build   # 生成 docs/
```

## 目录

```text
content/posts/*.md   文章（frontmatter + Markdown）
content/pages/*.md   独立页面（关于等）
src/styles/main.css  全部样式与两套主题令牌
src/client.js        水下波光 canvas / 月相 / Dark Hour 时钟 / 转场
src/assets/          图片、图标
build/               构建脚本与模板
site.config.mjs      站点信息、导航、标签映射
docs/                构建产物 = 站点全部内容
```

## 改这些就能变成你自己的站

1. `site.config.mjs`：`title` / `latinTitle` / `subtitle` / `author` / `description` / `base` / `nav` / `social`；
2. `content/pages/about.md`：自我介绍；
3. `src/assets/favicon.svg`：换成你自己的标识；
4. 删掉 `content/posts/` 里的示例文章。

`base` 的取值规则：

| 站点类型 | 仓库名 | base |
| --- | --- | --- |
| 用户站点 | `<user>.github.io` | `/` |
| 项目站点 | `<user>.github.io/blog` | `/blog/` |

## 加一篇文章

在 `content/posts/` 新建 `2026-10-01-hello.md`：

```markdown
---
title: 标题
latin: HELLO
date: 2026-10-01
tags: [技术]
description: 摘要，会出现在卡片、RSS 和 meta description 里
pinned: false
draft: false
---

正文……
```

- `slug` 默认取文件名（去掉扩展名），也可以用 frontmatter 的 `slug` 覆盖；
- 站内链接写绝对路径（`/posts/xxx/`、`/feed.xml`），构建时会自动补上 `base` 前缀；
- `{{author}}` `{{title}}` `{{year}}` 会在正文里被替换成站点配置的值；
- 标签名如果不在 `site.config.mjs` 的 `tagKeys` 里，会用 slug 结果当目录名。

## 部署到 GitHub Pages

仓库名假设是 `blog`。先确认 `site.config.mjs` 里 `base: '/blog/'`（用户站点保持 `/`），然后二选一。

### 方式 A：分支发布（最简单，不需要 CI）

```bash
npm run build
git add -A && git commit -m "site: 月相记录"
git push
```

GitHub 仓库 → **Settings → Pages → Build and deployment**：

- Source: **Deploy from a branch**
- Branch: `main` / **`/(docs)`** → Save

十几秒后访问 `https://<user>.github.io/blog/`。`docs/` 里已经带好 `.nojekyll`，Jekyll 不会干扰构建产物。

> 这个方式要求 `docs/` 被提交进仓库。仓库里 `.gitignore` 没有忽略它，保持现状即可。

### 方式 B：GitHub Actions 自动构建

同样的 Pages 设置里把 Source 改成 **GitHub Actions**，然后只推送源码：

```bash
git add -A && git commit -m "posts: 新文章"
git push   # .github/workflows/deploy.yml 会 npm ci && npm run build && 发布 docs/
```

工作流已经用 `github.event.repository.name` 自动推导 `BASE_PATH`，本地 `site.config.mjs` 的 `base` 不影响 CI。走这条路可以把 `docs/` 加进 `.gitignore`，也可以直接删掉 `.github/` 回到方式 A。

## 已实现的东西

- 首页（Hero + 重点记录 + 最近五条 + 引言块）
- 文章页：目录侧栏、滚动高亮、上一篇/下一篇、阅读时长
- 归档页（按年分组）、标签墙、标签页
- 关于页、404 页
- RSS (`/feed.xml`) 与 sitemap、robots
- 两套主题：**深渊**（默认冷蓝）/ **Dark Hour**（墨绿金），开关在右上角并记忆在 localStorage
- 真实时间到 `0:00` 时自动进入 Dark Hour（未手动选过主题的前提下）
- 左侧月相：跟随本地日期计算真实月相与亮度，同时是滚动进度条
- 页面跳转的水幕转场、卡片的波光扫过
- `prefers-reduced-motion` 降级、`:focus-visible` 可见、打印样式

## 常见问题

**样式和图片全 404。** `base` 没配对。项目站要写 `/仓库名/`，注意首尾都要斜杠。

**本地 dev 打不开。** 端口默认 4321，被占用了用 `PORT=5000 npm run dev`。

**月相侧栏看不见。** 它在窗口宽度小于 1320px 时隐藏，属于设计决定，不是 bug。

**字体没加载。** 标题用 Google Fonts 上的 Bebas Neue + Noto Sans SC。访问不了时会回落到系统中文字体，排版会略偏，但仍然可用。要彻底离线就把字体下载进 `src/assets/fonts/` 并改写 `main.css` 顶部的 `--font-*`。
