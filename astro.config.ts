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
  site: process.env.SITE_ORIGIN || 'https://hnsknoah.github.io',
  base: resolveBase(),
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: 'shiki',
    // 双主题：Astro 会同时输出 --shiki-light / --shiki-dark 两组色值，
    // 由 main.css 接管取值时机（跟我们的 NIGHT 开关，而不是系统的 prefers-color-scheme）
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
    // h2-h4 补 id，目录锚点才有地方跳
    remarkPlugins: [remarkHeadingIds],
    rehypePlugins: [],
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
})
