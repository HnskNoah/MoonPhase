import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { loadPosts } from '../lib/posts'
import { config } from '../consts'

export async function GET(context: APIContext) {
  const posts = await loadPosts()
  return rss({
    title: config.title,
    description: config.description,
    site: context.site ?? new URL('https://example.github.io'),
    items: posts.slice(0, config.feedLimit).map((p) => ({
      title: p.title,
      description: p.description,
      pubDate: p.date,
      link: `/posts/${p.slug}/`,
    })),
    trailingSlash: true,
  })
}
