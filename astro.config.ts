import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { remarkHeadingIds } from './src/lib/headings'

/**
 * BASE_PATH 只取最后一段合法字符：
 * CI 里传 /仓库名/，而 Git Bash 会把 /blog/ 改写成 C:/Program Files/Git/blog/，
 * 这里一并兜住。Astro 的 base 不能带尾斜杠。
 */
function resolveBase(): string {
  const raw = process.env.BASE_PATH || ''
  const seg = raw
    .split('/')
    .map((s) => s.replace(/[^A-Za-z0-9._~-]/g, ''))
    .filter(Boolean)
    .pop()
  return seg ? `/${seg}` : '/'
}

export default defineConfig({
  // 用户站点：<user>.github.io；项目站点：<user>.github.io/仓库名
  site: process.env.SITE_ORIGIN || 'https://example.github.io',
  base: resolveBase(),
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    // 代码块不做语法着色：配色由 main.css 统一控制，
    // 夜间模式切换时代码块颜色能一起变（Shiki 双主题走的是 prefers-color-scheme，不跟我们的开关）
    syntaxHighlight: 'shiki',
    shikiConfig: { defaultLang: 'text' },
    // h2-h4 补 id，目录锚点才有地方跳
    remarkPlugins: [remarkHeadingIds],
    rehypePlugins: [],
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
})
