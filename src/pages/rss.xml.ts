import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { loadPosts } from '../lib/posts'
import { base, u } from '../lib/site'
import { config } from '../consts'

export async function GET(context: APIContext) {
  const posts = await loadPosts()
  const origin = context.site ?? new URL('https://hnsknoah.github.io')
  return rss({
    title: config.title,
    description: config.description,
    // site 只到根域时，频道地址会漏掉项目站点的前缀（/MoonPhase）
    site: new URL(`${base}/`, origin),
    items: posts.slice(0, config.feedLimit).map((p) => ({
      title: p.title,
      description: p.description,
      pubDate: p.date,
      // @astrojs/rss 用 new URL(link, site) 解析，以 / 开头的 link 会把 site 的路径整段替换掉，
      // 所以前缀必须写进 link 本身
      link: u(`/posts/${p.slug}/`),
    })),
    trailingSlash: true,
  })
}
