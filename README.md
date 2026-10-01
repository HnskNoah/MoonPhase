# 月相记录 · MoonPhase

Astro 5 + TypeScript 写的个人博客，纯静态产物，部署在 GitHub Pages（`https://hnsknoah.github.io/MoonPhase/`）。

界面只有一套语言：白纸面的硬阴影纸牌、钴蓝圆碟、撕下来的旗标、巨型斜体重型字，外加一句反复出现的 MEMENTO MORI。全站唯一的开关是右上角的 `NIGHT`。

## 先看哪条命令

```bash
npm install     # 装依赖
npm run dev     # 本地开发 http://localhost:4321，带热更新
npm run check   # 类型检查（.astro + .ts），CI 里排在 build 之前
npm run build   # 生成 dist/
npm run preview # 预览构建产物
```

`astro build` 自己不做 typecheck，所以改动落地前跑 `npm run check`。

## 目录

```text
src/content/posts/*.md   文章（frontmatter + Markdown）
src/content/pages/*.md   独立页面（关于等）
src/content.config.ts    内容集合与 zod 校验（字段写错会构建失败，不会静默兜底）
src/consts.ts            站点信息、导航、标签映射、分页大小、RSS 条数
src/lib/                 日期 / slug / 罗马数字 / 阅读时长 / 摘录 / 分页 / 标题锚点 / 占位符替换
src/layouts/Layout.astro 全站外壳（head、顶栏、月相轨、页脚）
src/components/          Hero / PostCard / PageHead / ArchiveBody / Pager 等
src/pages/               路由：首页、文章、归档（分页）、标签（分页）、关于、404、rss、robots
src/styles/main.css      全部样式与主题令牌
src/scripts/client.ts    月相 / 阅读进度 / 时钟 / 夜间模式 / 目录高亮 / 移动菜单
src/assets/              需要进图片管线的素材（头图）
public/                  原样拷贝的资源（favicon、.nojekyll）
astro.config.ts          site / base / 集成 / markdown 插件
```

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
- 字段名写错、日期格式不对，`npm run build` 会报错并指出文件
- 站内链接一律写绝对路径（`/posts/xxx/`）。模板里过 `src/lib/site.ts` 的 `u()`，Markdown 里直接写就行——Astro 会给它补 base，实测带前缀的构建把 `/rss.xml` 输出成了 `/MoonPhase/rss.xml`
- `{{author}}` `{{title}}` `{{latinTitle}}` `{{subtitle}}` `{{year}}` 会由 `src/lib/placeholders.ts` 从 `src/consts.ts` 取值替换掉，只管正文：**frontmatter 里的 `title` / `description` 不参与替换**（remark 看不到它们），要引用站点信息就直接写死或走模板。边界：正文、行内代码、链接和图片来源都会替换；围栏代码块保持原样（里面的 `{{...}}` 通常是示例）；认不出的键原样留着，不会被悄悄吞掉。`year` 是构建时的年份，跨年要重新构建一次才会变

## 部署到 GitHub Pages

仓库是项目站点（`HnskNoah/MoonPhase`），所以 URL 带 `/MoonPhase` 前缀。推送源码，然后 **Settings → Pages → Build and deployment → Source: GitHub Actions**。

之后每次 `git push` 到 `main`，`.github/workflows/deploy.yml` 依次跑 `npm ci` → `npm run check` → `npm run build`，把 `dist/` 作为 Pages 产物发布。`BASE_PATH` 由仓库名自动推导，`SITE_ORIGIN` 取 `<user>.github.io`，两者都是 workflow 里的环境变量。

`dist/` 不进仓库（已在 `.gitignore`），所以不会出现「几百个 HTML 淹没 diff」。`public/.nojekyll` 保留着，万一改成分支发布不会被 Jekyll 拦。

依赖是从 `registry.npmmirror.com` 装的，锁文件里的 `resolved` 地址也都指向镜像；CI 同样从镜像拉包。换回官方源要整份重装锁文件，别只改几行。

本地按项目站点构建：

```bash
BASE_PATH=/MoonPhase SITE_ORIGIN=https://hnsknoah.github.io npm run build
```

## 配色：一套语言 + 夜间模式

夜间模式只翻令牌，不重写组件，所以新加样式时**不要写死颜色**：

| 令牌                               | 含义             | 浅色                     | 夜间                        |
| ---------------------------------- | ---------------- | ------------------------ | --------------------------- |
| `--plate`                          | 纸牌表面         | `#ffffff`                | `#0b1826`                   |
| `--edge`                           | 纸牌描边         | `#0a121c`                | `rgba(206, 230, 250, 0.55)` |
| `--shadow-hard` / `--shadow-hover` | 硬阴影           | 蓝灰 / 青                | 黑 / 更淡的青               |
| `--band` / `--band-ink`            | 页脚带           | `#0a121c` / `#ffffff`    | `#030a13` / `#e6f0fb`       |
| `--ghost`                          | 巨型编号水印     | `rgba(10, 18, 28, 0.16)` | `rgba(230, 240, 251, 0.14)` |
| `--eclipse`                        | 月食缺口的暗色   | `#0b1c33`                | `#04070a`                   |
| `--ink-link` / `--red-text`        | 纸面上的强调文字 | `#122c68` / `#c22c16`    | `#7cc0ff` / `#ff8070`       |

形状令牌（`--flag`、`--panel-clip`、`--chip-radius` 等）也在 `:root`，改轮廓只动那里。

主题选择在 localStorage（键 `p3-night`），首次访问跟随系统 `prefers-color-scheme`；`<head>` 里有一段内联脚本在绘制前落 `data-theme`，避免闪白。

## 已实现的东西

- 首页（Hero + 重点记录 + 最近五条 + 引言块）
- 文章页：目录侧栏、滚动高亮、上一篇/下一篇、阅读时长、标题锚点
- 归档页按年分组并分页（每页 30），标签墙与标签页同样分页（每页 20）
- 关于页、404 页
- RSS (`/rss.xml`)、`sitemap-index.xml`、robots
- 图片管线：首页圆框的头图由 `astro:assets` 出 4 档 WebP（`quality={90}`，93KB 原图 → 22/36/52/74KB）并写进 `srcset`；背景那层大圆盘单独取 1000w
- 顶栏 Dark Hour 时钟，走到 0:00 会高亮提示
- 左侧月相轨：按本地日期算真实月相与亮度，同时是滚动进度条；左上角徽标和首页圆框共用同一个计算。圆框的缺口是**镂空**而不是黑遮罩：`.hero-img` 用 `mask-image: radial-gradient(50% 50% at var(--bite-x) 50%, …)` 把照片啃掉一块，`--bite-x` 由 `client.ts` 写入，`.hero-frame` 的背景是透明的，所以缺口直接透出 `.sea` 那层背景
- 整张卡片可点击（标题链接铺满卡片，标签与 READ 仍可单独点）
- 页面跳转不做自定义转场：走浏览器原生导航，少一层跨浏览器不一致
- `prefers-reduced-motion` 降级、`:focus-visible` 可见、打印样式

## 常见问题

**样式和图片全 404。** base 没配对。项目站点要传 `BASE_PATH=/仓库名`，用户站点留空。

**本地 dev 打不开。** 端口默认 4321，被占用就 `npx astro dev --port 5000`。

**月相侧栏看不见。** 窗口宽度小于 1320px 时隐藏，属于设计决定。

**圆框图糊。** 两条来路，别再踩回去：一是动效，`@keyframes sink` 用 `object-position` 挪取景窗，**不要改回 `transform: scale`**——那是把裁好的栅格再放大 4~11%。二是取景比例，圆框是 1:1 而原图 1792×1024，`object-fit: cover` 永远只看得见中间那条 1024px 高的横条，所以 2× 屏上框一旦超过约 512 CSS px 就会开始糊，多加 `srcset` 档位救不了，只能换更高或接近正方形的原图、或者压小框。`sizes` 也因此按「框宽 ×1.75」写（`(max-width: 900px) 161vw, 860px`），照框宽本身写会让浏览器挑小图。

**代码块颜色不跟着夜间模式变。** `astro.config.ts` 配的是 `shikiConfig.themes: { light, dark }`，浅色值直接写进 `style="color:…"`，暗色值只挂在 `--shiki-dark` 上；Astro 在这种情况下不输出任何切换样式表，所以 `main.css` 里用 `[data-theme='night'] .prose pre span { color: var(--shiki-dark) !important }` 接管。换主题名只改 config 那两个字符串，别在 CSS 里写死色值。

**字体没加载。** 标题用 Google Fonts 的 Archivo（含斜体）+ Noto Sans SC，等宽是 JetBrains Mono。访问不了会回落到系统中文字体，排版略偏但仍可用。彻底离线就把字体下载进 `src/assets/fonts/` 并改 `main.css` 顶部的 `--font-*`。
