# 月相记录 · 女神异闻录3 风格个人博客

Astro 5 + TypeScript 写的静态博客，视觉语言取自《女神异闻录3 Reload》的菜单界面：白纸面、钴蓝圆碟、撕纸旗标、巨型斜体重型字、硬阴影纸牌，以及那句反复出现的 MEMENTO MORI。产物是纯静态文件，部署在 GitHub Pages。

## 先看哪条命令

```bash
npm install     # 装依赖
npm run dev     # 本地开发 http://localhost:4321，带热更新
npm run check   # 类型检查（.astro + .ts，CI 里在 build 之前跑）
npm run build   # 生成 dist/
npm run preview # 预览构建产物
```

## 目录

```text
src/content/posts/*.md   文章（frontmatter + Markdown）
src/content/pages/*.md   独立页面（关于等）
src/content.config.ts    内容集合与 zod 校验（字段写错会构建失败，不会静默兜底）
src/consts.ts            站点信息、导航、标签映射、分页大小
src/lib/                 日期 / slug / 罗马数字 / 阅读时长 / 分页 / 标题锚点
src/layouts/Layout.astro 全站外壳（head、顶栏、月相轨、页脚）
src/components/          Hero / PostCard / PageHead / ArchiveBody / Pager 等
src/pages/               路由：首页、文章、归档（分页）、标签（分页）、关于、404、rss、robots
src/styles/main.css      全部样式与主题令牌
src/scripts/client.ts    月相 / 进度 / 时钟 / 夜间模式 / 目录高亮 / 移动菜单
src/assets/              需要进图片管线的素材（头图）
public/                  原样拷贝的资源（favicon、.nojekyll）
astro.config.ts          site / base / 集成 / markdown 插件
```

## 改这些就能变成你自己的站

1. `src/consts.ts`：`title` / `latinTitle` / `subtitle` / `author` / `description` / `nav` / `social` / `tagKeys` / `pagination`
2. `src/content/pages/about.md`：自我介绍
3. `public/assets/favicon.svg`：换成你自己的标识
4. 删掉 `src/content/posts/` 里的示例文章

## 加一篇文章

在 `src/content/posts/` 新建 `2026-10-01-hello.md`：

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

- URL 用文件名（去掉扩展名），也可以用 frontmatter 的 `slug` 覆盖
- 字段名写错、日期格式不对，构建时会直接报错并指出文件（这是换 Astro 的主要收益之一）
- 站内链接写绝对路径（`/posts/xxx/`），Astro 会自动补 base 前缀
- `{{author}}` `{{title}}` `{{year}}` 这类替换目前没有做，需要的话在 `src/lib/` 加个 remark 插件

## 部署到 GitHub Pages

仓库名假设是 `blog`。推送源码，然后 **Settings → Pages → Build and deployment → Source: GitHub Actions**。

之后每次 `git push` 到 `main`，`.github/workflows/deploy.yml` 会 `npm ci && npm run build`，把 `dist/` 作为 Pages 产物发布，并用仓库名自动推导 `BASE_PATH`（用户站点把它改成 `/`）。十几秒后可访问 `https://<user>.github.io/blog/`。

`dist/` 不进仓库（已在 `.gitignore`），所以不会出现「几百个 HTML 淹没 diff」的问题。`public/.nojekyll` 仍然保留，万一你想改成分支发布也不会被 Jekyll 拦。

本地构建项目站点：

```bash
BASE_PATH=/blog SITE_ORIGIN=https://<user>.github.io npm run build
```

## 配色：一套 P3R + 夜间模式

全站只有一套界面语言，右上角 `NIGHT` 按钮切夜间；选择记在 localStorage，首次访问跟随系统 `prefers-color-scheme`，`<head>` 里有一段内联脚本在绘制前落主题，避免闪白。

夜间模式只翻令牌，不重写组件，所以新加样式时**不要写死颜色**：

| 令牌 | 含义 | 浅色 | 夜间 |
| --- | --- | --- | --- |
| `--plate` | 纸牌表面 | `#fff` | `#0b1826` |
| `--edge` | 纸牌描边 | `#0a121c` | 半透明浅蓝线 |
| `--shadow-hard` / `--shadow-hover` | 硬阴影 | 蓝灰 | 黑 / 青 |
| `--band` / `--band-ink` | 页脚黑带 | 黑底白字 | 更深底 |
| `--ghost` | 巨型编号水印 | 淡黑 | 淡白 |
| `--eclipse` | 月相食用阴影 | `#0b1c33` | `#04070a` |
| `--ink-link` / `--red-text` | 纸面上的强调文字 | 深蓝 / 深红 | 提亮版 |

形状令牌（`--flag`、`--panel-clip`、`--chip-radius` 等）也在 `:root`，改轮廓只动那里。

## 已实现的东西

- 首页（Hero + 重点记录 + 最近五条 + 引言块）
- 文章页：目录侧栏、滚动高亮、上一篇/下一篇、阅读时长、标题锚点
- 归档页按年分组并**分页**（默认每页 30），标签墙与标签页同样分页（每页 20）
- 关于页、404 页
- RSS (`/rss.xml`)、`sitemap-index.xml`、robots
- 图片管线：头图由 `astro:assets` 自动出 3 档 WebP（90KB 原图 → 5/9/15/37KB）并写进 `srcset`
- 夜间模式（见上）
- 顶栏 Dark Hour 时钟，走到 0:00 会高亮提示
- 左侧月相：按本地日期算真实月相与亮度，同时是滚动进度条；左上角徽标与首页圆框里的月相遮罩共用同一个计算
- 整张卡片可点击（标题链接铺满卡片，标签与 READ 仍可单独点）
- 页面跳转不做自定义转场：走浏览器原生导航，少一层跨浏览器不一致
- `prefers-reduced-motion` 降级、`:focus-visible` 可见、打印样式

## 常见问题

**样式和图片全 404。** base 没配对。项目站点要传 `BASE_PATH=/仓库名`，用户站点留空。

**本地 dev 打不开。** 端口默认 4321，被占用用 `PORT=5000 npx astro dev --port 5000`。

**月相侧栏看不见。** 窗口宽度小于 1320px 时隐藏，属于设计决定。

**代码块颜色不跟着夜间模式变。** `astro.config.ts` 里配的是 `shikiConfig.themes: { light, dark }`，浅色值直接写进 `style="color:…"`，暗色值只挂在 `--shiki-dark` 上；Astro 附带的切换规则走 `prefers-color-scheme`，不认我们的开关，所以 `main.css` 里用 `[data-theme='night'] .prose pre span { color: var(--shiki-dark) !important }` 接管。换主题名只改 config 那两个字符串，别在 CSS 里写死色值。

**字体没加载。** 标题用 Google Fonts 的 Archivo（含斜体）+ Noto Sans SC。访问不了会回落到系统中文字体，排版略偏但仍可用。彻底离线就把字体下载进 `src/assets/fonts/` 并改 `main.css` 顶部的 `--font-*`。
