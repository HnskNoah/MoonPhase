import { getCollection, type CollectionEntry } from 'astro:content'
import { excerpt, readingMinutes, tagKey } from './site'

export type PostEntry = CollectionEntry<'posts'>

export interface Post {
  slug: string
  entry: PostEntry
  title: string
  latin: string
  date: Date
  updated?: Date
  tags: string[]
  tagItems: { label: string; key: string }[]
  description: string
  minutes: number
  pinned: boolean
}

/** 文章 URL 用的 slug：frontmatter 的 slug 优先，否则用文件名 */
const slugOf = (e: PostEntry): string => e.data.slug ?? e.id.replace(/\//g, '-')

/** 读入全部文章（排除草稿），置顶优先、其余按日期倒序 */
export async function loadPosts(): Promise<Post[]> {
  const entries = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => Number(b.data.pinned) - Number(a.data.pinned) || b.data.date.getTime() - a.data.date.getTime(),
  )
  return entries.map((e) => {
    const body = e.body ?? ''
    const tags = e.data.tags
    return {
      slug: slugOf(e),
      entry: e,
      title: e.data.title,
      latin: e.data.latin,
      date: e.data.date,
      updated: e.data.updated,
      tags,
      tagItems: tags.map((t) => ({ label: t, key: tagKey(t) })),
      description: e.data.description ?? excerpt(body),
      minutes: readingMinutes(body),
      pinned: e.data.pinned,
    }
  })
}

export interface TagGroup {
  key: string
  label: string
  posts: Post[]
}

export function groupByTag(posts: Post[]): TagGroup[] {
  const map = new Map<string, TagGroup>()
  for (const p of posts) {
    for (const t of p.tagItems) {
      if (!map.has(t.key)) map.set(t.key, { key: t.key, label: t.label, posts: [] })
      map.get(t.key)!.posts.push(p)
    }
  }
  return [...map.values()].sort((a, b) => b.posts.length - a.posts.length || a.key.localeCompare(b.key))
}
