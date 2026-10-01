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

## 项目结构

四层，依赖方向只往下：`pages → layouts/components → lib → content/consts`，浏览器侧的 `scripts/client.ts` 只认 DOM 和 CSS 变量，不参与构建期。

```text
astro.config.ts             site / base / 集成 / markdown 插件（两个 remark 插件都挂在这）
src/consts.ts               站点信息、导航、标签映射、分页大小、RSS 条数 —— 纯数据，不含 import.meta.env
src/content.config.ts       两个内容集合 + zod 校验（字段写错构建就失败，不静默兜底）
src/content/posts/*.md      文章
src/content/pages/*.md      独立页面（按 slug 出到站点根，目前只有关于页）

src/lib/                    构建期的纯函数，全部不碰 DOM
  text.ts                   日期 / slug / 罗马数字 / 阅读时长 / 是否中日韩字符 / 摘录
  site.ts                   base 与前缀 u()、标签 key；末尾 re-export text.ts
  posts.ts                  读集合、置顶+日期排序、标签分组、阅读时长、摘要
  paginate.ts               通用分页（归档与标签页共用）
  headings.ts               标题 id 的唯一算法 + 补 id 的 remark 插件 + 目录生成
  placeholders.ts           {{author}} 这类占位符的 remark 插件
  moon.ts                   月相计算：相位 / 亮度 / 月龄 / 亮面轮廓路径（构建期预画与浏览器共用一份）

src/layouts/Layout.astro    全站外壳：head、顶栏、月相轨、页脚、绘制前落主题的内联脚本
src/components/             Hero / Feature / PostList / PostCard / PageHead / ArchiveBody / Pager / SectionHead
src/pages/                  路由，见下表
src/scripts/client.ts       浏览器侧：月相 / 阅读进度 / Dark Hour 时钟 / 夜间开关 / 目录高亮 / 移动菜单
src/styles/main.css         前段骨架（尺寸布局动效）+ 后段皮肤（颜色描边阴影切角），同一属性不重复
src/assets/abyss.jpg        背景那层大圆盘的原图（首页右栏已经不用它），交给 astro:assets 出 WebP
src/assets/moon.jpg         首页月亮的盘面照片，NASA Goddard 拍的满月，公有领域、无需署名；已从 2400² 裁成 1200² 正方形、盘面内切
public/                     原样拷贝：assets/favicon.svg、.nojekyll
.github/workflows/deploy.yml  npm ci → astro check → build → 把 dist/ 作为 Pages 产物
```

### 路由

| 文件                                   | URL                | 说明                                      |
| -------------------------------------- | ------------------ | ----------------------------------------- |
| `src/pages/index.astro`                | `/`                | 首页：Hero + 重点记录 + 最近五条 + 引言块 |
| `src/pages/posts/[...slug].astro`      | `/posts/<slug>/`   | 文章页：目录、滚动高亮、上一篇/下一篇     |
| `src/pages/archive/index.astro`        | `/archive/`        | 归档第 1 页                               |
| `src/pages/archive/[...page].astro`    | `/archive/<n>/`    | 归档第 2 页起                             |
| `src/pages/tags/index.astro`           | `/tags/`           | 标签墙                                    |
| `src/pages/tags/[tag]/index.astro`     | `/tags/<key>/`     | 标签页第 1 页                             |
| `src/pages/tags/[tag]/[...page].astro` | `/tags/<key>/<n>/` | 标签页第 2 页起                           |
| `src/pages/[...slug].astro`            | `/<slug>/`         | 内容页面（关于页走这里）                  |
| `src/pages/404.astro`                  | `404.html`         | GitHub Pages 的自定义 404                 |
| `src/pages/rss.xml.ts`                 | `/rss.xml`         | RSS                                       |
| `src/pages/robots.txt.ts`              | `/robots.txt`      | 指向带 base 前缀的 sitemap                |

`trailingSlash: 'always'`，所以站内链接一律带尾斜杠；`<key>` 是中文标签在 `consts.ts` 的 `tagKeys` 里映射出的 ASCII（技术→tech、设计→design…），映射缺失时回落到 slugify。

### 依赖

只有 `astro` + `@astrojs/rss` + `@astrojs/sitemap` 三个运行时依赖，dev 侧加 `@astrojs/check`、`typescript`、`@types/mdast`、`prettier`(+astro 插件)。没有 UI 框架、没有客户端状态库、没有 CSS 框架。

当前 6 篇示例文章构建出 17 个 HTML（数据量小时分页路由不产出第 2 页）。

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

`main.css` 分两段：前面是**骨架**（尺寸、布局、动效），后面 `皮肤 · 纸面与硬阴影` 一段只改颜色、描边、阴影、切角。同一个选择器允许在两处各写一半，但**同一个属性不允许写两遍**——历史上这里叠了三套主题并存时的重复定义，已经按「只删永远输掉的那份声明」的方式折掉了（172 条声明、15 条空规则）。改样式前先想清楚属于哪一层：调大小去骨架，调颜色去皮肤。

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

形状令牌（`--flag`、`--flag-inner`、`--chip-clip`、`--chip-radius`）也在 `:root` 或组件规则里，改轮廓只动那里。

主题选择在 localStorage（键 `p3-night`），首次访问跟随系统 `prefers-color-scheme`；`<head>` 里有一段内联脚本在绘制前落 `data-theme`，避免闪白。

## 已实现的东西

- 首页（Hero：左侧文字 + 右侧一颗按真实相位画的月亮 + 三条读数，下面接重点记录、最近五条、引言块）
- 文章页：目录侧栏、滚动高亮、上一篇/下一篇、阅读时长、标题锚点
- 归档页按年分组并分页（每页 30），标签墙与标签页同样分页（每页 20）
- 关于页、404 页
- RSS (`/rss.xml`)、`sitemap-index.xml`、robots
- 图片管线：月亮盘面 1200² 原图由 `astro:assets` 出 960w WebP（239KB → 95KB），亮面与暗面共用同一个 URL，浏览器只解一次码；背景那层大圆盘单独取 1000w
- 三处月相同用一个相位计算（`src/lib/moon.ts`，`client.ts` 的 `paintMoon()` 调用）：左上角徽标与左侧月相轨是填 `--eclipse` 暗色的两圆近似，首页月亮是真实盘面 + 椭圆终止线 + 地照光暗面。前两处形状一致，第三处面积严格等于亮度
- 顶栏 Dark Hour 时钟，走到 0:00 会高亮提示
- 整张卡片可点击（标题链接铺满卡片，标签与 READ 仍可单独点）
- 页面跳转不做自定义转场：走浏览器原生导航，少一层跨浏览器不一致
- `prefers-reduced-motion` 降级、`:focus-visible` 可见、打印样式

## 常见问题

**样式和图片全 404。** base 没配对。项目站点要传 `BASE_PATH=/仓库名`，用户站点留空。

**本地 dev 打不开。** 端口默认 4321，被占用就 `npx astro dev --port 5000`。

**月相侧栏看不见。** 窗口宽度小于 1320px 时隐藏，属于设计决定。

**首页右栏（月亮）改起来注意八件事。**

- 亮面是**外沿半圆 + 半条椭圆终止线**（`litPathD()`，`src/lib/moon.ts`），`rx = 50·cos(2πp)`。这样亮区面积严格等于真实亮度；旧的「两圆相切」是近似，上弦时开口面积 61% 而真实亮面是 50%。上下弦不用特判：SVG 规范里零半径的弧直接当直线画，那条界自己就变直了。
- 亮度 <2% 时 `litPathD()` 返回**空字符串**，整轮交给暗面。别去掉这个阈值：新月附近亮面会缩成贴着圆边一条缝，偏移 2 个用户单位在 440px 盘上就是 2.3px 的亮线，看着像接缝错位而不像残月。
- **暗面不能是透明的**。以前那是「纸被啃穿、透出页面背景」，现在月亮是个独立物体，暗面透明等于连轮廓一起啃掉、新月整轮消失。所以暗面走地照光：同一张月面压暗再铺亮面。两个主题的系数不能合并 —— 白天页面 L=241，暗面 L≈14 是一块暗盘；夜里页面 L=12，暗面必须**比背景亮**（L≈23）才看得见，所以夜里是 `brightness(0.16)` 不是 0.1。
- 朝向：盈月亮面在右、亏月在左（北半球口径）。`client.ts` 里只有一个 `dir`，翻它徽标和月相轨一起跟着翻；favicon 的静态缺口本来就是亮右。
- 月龄数字**画两份**，各被自己的区域裁着：暗面上亮墨、月面上深墨。改成一份加描边不会跟着明暗界线走。字号写在 viewBox 的用户单位里（`30` = 直径的 30%），盘子缩放它跟着长。
- `.moon-stage` 的 `aspect-ratio: 1` 不能省：viewBox 是 100×100，盒子一变形月亮就成椭圆。也别给浮游动效加 `transform: scale` —— 那是把裁好的栅格再放大。
- 构建期 `Hero.astro` 会按**构建当天**预画一帧亮面和月龄，脚本加载后再按访问日期重画，所以月亮不会在 JS 跑起来之前空着。相位公式只允许 `src/lib/moon.ts` 一份，构建期和浏览器共用。
- 素材：`src/assets/moon.jpg` 是 NASA Goddard 拍的满月，公有领域、无需署名。已从 2400² 按量出来的圆心跳到正方形外接框（往里收 2px，免得把黑边带进圆内）缩到 1200²。换图的话重新量一次盘面，别目测裁。

**代码块颜色不跟着夜间模式变。** `astro.config.ts` 配的是 `shikiConfig.themes: { light, dark }`，浅色值直接写进 `style="color:…"`，暗色值只挂在 `--shiki-dark` 上；Astro 在这种情况下不输出任何切换样式表，所以 `main.css` 里用 `[data-theme='night'] .prose pre span { color: var(--shiki-dark) !important }` 接管。换主题名只改 config 那两个字符串，别在 CSS 里写死色值。

**换了 favicon 浏览器不更新。** `public/` 下的文件是原样拷贝、没有内容哈希，URL 一成不变，而 Chrome 的 favicon 缓存能撑好几天。所以 `Layout.astro` 在构建时读 `public/assets/favicon.svg` 算 sha256 前 8 位当查询参数（`favicon.svg?v=fdf10046`），图标一改 URL 就变，不用手动 bump 版本号。往 `public/` 里加别的图标类资源时同理。改这个 SVG 时注意：**XML 注释里不能出现连续两个连字符**（写 `--edge` 这种令牌名会让整份 SVG 解析失败，图标直接不显示，而构建不会报错）；改完可以把它丢进 `new DOMParser().parseFromString(s, 'image/svg+xml')` 验一下。

**字体没加载。** 标题用 Google Fonts 的 Archivo（含斜体）+ Noto Sans SC，等宽是 JetBrains Mono。访问不了会回落到系统中文字体，排版略偏但仍可用。彻底离线就把字体下载进 `src/assets/fonts/` 并改 `main.css` 顶部的 `--font-*`。
