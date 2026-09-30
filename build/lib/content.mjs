import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { ROOT, config, url } from '../context.mjs'
import { excerpt, injectHeadingIds, readingMinutes, slugify, toDate } from './util.mjs'

marked.setOptions({ gfm: true, breaks: false })

/** markdown -> html，替换 {{token}}，补标题 id，并给站内绝对路径加上 GitHub Pages 的 base 前缀 */
async function renderMarkdown(md) {
  const vars = {
    author: config.author,
    title: config.title,
    year: String(new Date().getFullYear()),
    base: config.base.replace(/\/$/, ''),
  }
  const filled = String(md).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m))
  const raw = await marked(filled)
  const { html, toc } = injectHeadingIds(raw)
  const fixed = html.replace(
    /(href|src)="(\/[^/][^"]*)"/g,
    (_m, attr, target) => ` ${attr}="${url(target)}"`,
  )
  return { html: fixed, toc }
}

export function tagKey(label) {
  return config.tagKeys?.[label] || slugify(label) || encodeURIComponent(label)
}

async function readDirRecursive(dir) {
  const out = []
  let entries = []
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await readDirRecursive(full)))
    else if (/\.(md|markdown)$/.test(e.name)) out.push(full)
  }
  return out
}

export async function loadPosts() {
  const files = await readDirRecursive(path.join(ROOT, 'content', 'posts'))
  const posts = []
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8')
    const { data, content } = matter(raw)
    if (data.draft) continue
    const rel = path.relative(path.join(ROOT, 'content', 'posts'), file).replace(/\\/g, '/')
    const slug = data.slug || rel.replace(/\.(md|markdown)$/, '').replace(/\//g, '-')
    const date = toDate(data.date || '1970-01-01')
    const { html, toc } = await renderMarkdown(content)
    const tags = (data.tags || []).map(String)
    posts.push({
      slug,
      source: rel,
      title: data.title || slug,
      latin: data.latin || '',
      description: data.description || excerpt(content),
      date,
      updated: data.updated ? toDate(data.updated) : null,
      tags,
      tagItems: tags.map((t) => ({ label: t, key: tagKey(t) })),
      pinned: Boolean(data.pinned),
      cover: data.cover || '',
      html,
      toc,
      markdown: content,
      minutes: readingMinutes(content),
    })
  }
  posts.sort((a, b) => (b.pinned - a.pinned) || (b.date - a.date))
  return posts
}

export async function loadPages() {
  const dir = path.join(ROOT, 'content', 'pages')
  const files = await readDirRecursive(dir)
  const pages = []
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8')
    const { data, content } = matter(raw)
    const rel = path.relative(dir, file).replace(/\\/g, '/').replace(/\.(md|markdown)$/, '')
    const slug = data.slug || rel
    const { html, toc } = await renderMarkdown(content)
    pages.push({
      slug,
      title: data.title || slug,
      latin: data.latin || '',
      description: data.description || excerpt(content),
      html,
      toc,
      minutes: readingMinutes(content),
      date: data.date ? toDate(data.date) : null,
    })
  }
  return pages
}

export function groupByTag(posts) {
  const map = new Map()
  for (const p of posts) {
    for (const t of p.tags) {
      const key = tagKey(t)
      if (!map.has(key)) map.set(key, { key, label: t, posts: [] })
      map.get(key).posts.push(p)
    }
  }
  return [...map.values()].sort((a, b) => b.posts.length - a.posts.length || a.key.localeCompare(b.key))
}

export function groupByYear(posts) {
  const map = new Map()
  for (const p of posts) {
    const y = p.date.getFullYear()
    if (!map.has(y)) map.set(y, [])
    map.get(y).push(p)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
}
