import type { APIContext } from 'astro'
import { base } from '../lib/site'

export function GET(context: APIContext) {
  const site = context.site ?? new URL('https://example.github.io')
  // sitemap 也在 base 前缀下面，漏掉它项目站点的爬虫会找不到索引
  const body = [`Sitemap: ${new URL(`${base}/sitemap-index.xml`, site).href}`, 'User-agent: *', 'Allow: /', ''].join(
    '\n',
  )
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
