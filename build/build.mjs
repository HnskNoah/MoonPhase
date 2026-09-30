import fs from 'node:fs/promises'
import path from 'node:path'
import { ROOT, config, absUrl } from './context.mjs'
import { loadPosts, loadPages, groupByTag } from './lib/content.mjs'
import {
  renderHome, renderPost, renderArchive, renderTagsIndex,
  renderTagPage, renderPage, render404, renderFeed, renderSitemap,
} from './templates/pages.mjs'

const DIST = path.join(ROOT, process.env.OUTPUT_DIR || 'docs')

async function writeOut(relPath, contents) {
  const full = path.join(DIST, relPath)
  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, contents, 'utf8')
  return relPath
}

async function copyDir(src, dest) {
  let entries = []
  try {
    entries = await fs.readdir(src, { withFileTypes: true })
  } catch {
    return 0
  }
  let n = 0
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) n += await copyDir(s, d)
    else {
      await fs.mkdir(path.dirname(d), { recursive: true })
      await fs.copyFile(s, d)
      n += 1
    }
  }
  return n
}

export async function build({ dev = false } = {}) {
  const started = Date.now()
  await fs.rm(DIST, { recursive: true, force: true })
  await fs.mkdir(DIST, { recursive: true })

  const posts = await loadPosts()
  const pages = await loadPages()
  const groups = groupByTag(posts)
  const written = []

  written.push(await writeOut('assets/main.css', await fs.readFile(path.join(ROOT, 'src', 'styles', 'main.css'), 'utf8')))
  written.push(await writeOut('assets/client.js', await fs.readFile(path.join(ROOT, 'src', 'client.js'), 'utf8')))
  const assetCount = await copyDir(path.join(ROOT, 'src', 'assets'), path.join(DIST, 'assets'))
  await copyDir(path.join(ROOT, 'public'), DIST)
  await writeOut('.nojekyll', '')

  written.push(await writeOut('index.html', renderHome({ posts, groups, dev })))
  written.push(await writeOut('archive/index.html', renderArchive({ posts, dev })))
  written.push(await writeOut('tags/index.html', renderTagsIndex({ groups, posts, dev })))
  for (const g of groups) {
    written.push(await writeOut(`tags/${g.key}/index.html`, renderTagPage({ group: g, posts, dev })))
  }
  for (const p of pages) {
    written.push(await writeOut(`${p.slug}/index.html`, renderPage({ page: p, posts, dev })))
  }
  for (let i = 0; i < posts.length; i += 1) {
    written.push(await writeOut(`posts/${posts[i].slug}/index.html`, renderPost({
      post: posts[i],
      prev: posts[i + 1] || null,
      next: posts[i - 1] || null,
      posts,
      dev,
    })))
  }
  written.push(await writeOut('404.html', render404({ posts, dev })))
  if (config.feed?.enabled !== false) {
    written.push(await writeOut('feed.xml', renderFeed({ posts })))
    written.push(await writeOut('sitemap.xml', renderSitemap({ posts, pages })))
  }
  written.push(await writeOut('robots.txt', `Sitemap: ${absUrl('/sitemap.xml')}\nUser-agent: *\nAllow: /\n`))

  console.log(`✓ ${written.length} 个页面 + ${assetCount} 个图片资源 -> ${path.relative(ROOT, DIST).replace(/\\/g, '/')}  (${Date.now() - started}ms)`)
  console.log(`  base=${config.base}  posts=${posts.length}  pages=${pages.length}  tags=${groups.length}`)
  return { posts, pages, groups }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, 'build', 'build.mjs')
if (isDirectRun) {
  build({ dev: process.argv.includes('--dev') }).catch((err) => {
    console.error('\n✗ 构建失败：')
    console.error(err)
    process.exitCode = 1
  })
}
