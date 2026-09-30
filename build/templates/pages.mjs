import { config, url, absUrl } from '../context.mjs'
import { escapeHtml, fmtDate, fmtDateIso } from '../lib/util.mjs'
import { layout, pageHead, postCard } from './layout.mjs'

const arrow = '<i aria-hidden="true">▸</i>'

/* ---------------- 首页 ---------------- */

function heroPanel() {
  return `<div class="hero-panel">
  <div class="hero-frame">
    <img class="hero-img" src="${url('/assets/abyss.jpg')}" alt="深海与月光的抽象背景" width="1792" height="1024" fetchpriority="high">
    <!-- 月相遮罩叠在照片上：multiply 混合，像明暗界线而不是黑咬一口 -->
    <svg class="hero-phase" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs><clipPath id="hp-clip"><circle cx="16" cy="16" r="16"/></clipPath></defs>
      <g clip-path="url(#hp-clip)"><circle class="hp-shadow" id="hp-shadow" cx="16" cy="16" r="16"/></g>
      <!-- 明暗界线的受光边 -->
      <g clip-path="url(#hp-clip)"><circle class="hp-rim" id="hp-rim" cx="16" cy="16" r="15.7"/></g>
    </svg>
    <span class="hero-frame-edge" aria-hidden="true"></span>
  </div>
  <dl class="hero-stats">
    <div><dt>PHASE</dt><dd class="moon-name">—</dd></div>
    <div><dt>DATE</dt><dd class="stat-date">—</dd></div>
    <div><dt>RECORDS</dt><dd class="stat-count">—</dd></div>
  </dl>
</div>`
}

function heroSection(posts, groups) {
  const latest = posts[0]
  return `<section class="hero">
  <div class="hero-text">
    <p class="kicker"><span class="kicker-tick"></span>0:00 &nbsp;/&nbsp; AFTER SCHOOL HOURS</p>
    <h1 class="hero-title">
      <span class="hero-title-latin">${escapeHtml(config.latinTitle)}</span>
      <span class="hero-title-main">${escapeHtml(config.title)}</span>
    </h1>
    <p class="hero-sub">${escapeHtml(config.subtitle)}</p>
    <p class="hero-desc">${escapeHtml(config.description)}</p>
    <div class="hero-cta">
      <a class="btn btn--solid" href="${url('/archive/')}">进入归档 ${arrow}</a>
      <a class="btn" href="${url(`/posts/${latest.slug}/`)}">读最新一条 ${arrow}</a>
    </div>
    <ul class="hero-tags">
      ${groups.slice(0, 6).map((t, i) =>
        `<li style="--i:${i}"><a href="${url(`/tags/${t.key}/`)}">${escapeHtml(t.label)}</a></li>`).join('')}
    </ul>
  </div>
  ${heroPanel()}
</section>
<div class="tide" aria-hidden="true"><span></span></div>`
}

function featuredSection(p) {
  if (!p) return ''
  return `<section class="section">
  <header class="section-head">
    <h2 class="section-title"><span class="st-latin">HIGHLIGHT</span><span class="st-main">重点记录</span></h2>
    <span class="section-rule"></span>
  </header>
  <a class="feature" href="${url(`/posts/${p.slug}/`)}">
    <span class="feature-idx">${escapeHtml(p.latin || 'PHASE')}</span>
    <span class="feature-main">
      <b>${escapeHtml(p.title)}</b>
      <i>${escapeHtml(p.description)}</i>
    </span>
    <span class="feature-meta"><time>${fmtDate(p.date)}</time><em>${p.minutes} min</em></span>
    <span class="feature-go">READ ${arrow}</span>
  </a>
</section>`
}

function listSection(title, latin, posts, offset = 0) {
  if (!posts.length) return ''
  return `<section class="section">
  <header class="section-head">
    <h2 class="section-title"><span class="st-latin">${escapeHtml(latin)}</span><span class="st-main">${escapeHtml(title)}</span></h2>
    <span class="section-rule"></span>
    <a class="section-more" href="${url('/archive/')}">全部 ${arrow}</a>
  </header>
  <div class="card-list">
    ${posts.map((p, i) => postCard(p, { index: i + offset })).join('')}
  </div>
</section>`
}

export function renderHome({ posts, groups, dev }) {
  const body = `
  ${heroSection(posts, groups)}
  ${featuredSection(posts.find((p) => p.pinned) || posts[0])}
  ${listSection('最近的记录', 'RECENT', posts.filter((p) => !p.pinned).slice(0, 5), 1)}
  <section class="section quote-block">
    <p class="quote">“所谓长大，就是开始记住那些终将逝去的东西。”</p>
    <p class="quote-latin">MEMENTO MORI — 由 <b>${escapeHtml(config.author)}</b> 记录于深青色的海里</p>
  </section>`
  return layout({
    description: config.description,
    path: '/',
    active: '/',
    bodyClass: 'page-home',
    postsCount: posts.length,
    dev,
    body,
  })
}

/* ---------------- 文章页 ---------------- */

function tocBlock(toc) {
  if (!toc || toc.length < 2) return ''
  return `<nav class="toc" aria-label="目录">
  <p class="toc-head">CONTENTS</p>
  <ol>${toc.map((t) => `<li class="lvl-${t.level}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('')}</ol>
</nav>`
}

export function renderPost({ post, prev, next, posts, dev }) {
  const meta = [
    `<time datetime="${fmtDateIso(post.date)}">${fmtDate(post.date)}</time>`,
    post.updated ? `<span>更新 ${fmtDate(post.updated)}</span>` : '',
    `<span>${post.minutes} min</span>`,
    `<span>${escapeHtml(config.author)}</span>`,
    post.tagItems.map((t) => `<a class="chip" href="${url(`/tags/${t.key}/`)}">${escapeHtml(t.label)}</a>`).join(' '),
  ].filter(Boolean).join('<span class="meta-dot">·</span>')

  const body = `
  <article class="post">
    ${pageHead({ kicker: post.latin || 'RECORD', latin: post.latin, title: post.title, meta })}
    <div class="post-grid">
      ${tocBlock(post.toc)}
      <div class="prose">${post.html}</div>
    </div>
    <div class="post-end">
      <span class="end-rule"></span>
      <p class="end-mark">MEMENTO MORI</p>
    </div>
    <nav class="post-nav">
      ${prev ? `<a class="pn pn--prev" href="${url(`/posts/${prev.slug}/`)}"><span>PREV</span><b>${escapeHtml(prev.title)}</b></a>` : '<span class="pn"></span>'}
      ${next ? `<a class="pn pn--next" href="${url(`/posts/${next.slug}/`)}"><span>NEXT</span><b>${escapeHtml(next.title)}</b></a>` : '<span class="pn"></span>'}
    </nav>
  </article>`
  return layout({
    title: post.title,
    description: post.description,
    path: `/posts/${post.slug}/`,
    active: '/archive/',
    bodyClass: 'page-post',
    postsCount: posts.length,
    dev,
    body,
  })
}

/* ---------------- 归档 ---------------- */

export function renderArchive({ posts, dev }) {
  const years = []
  for (const p of posts) {
    const y = p.date.getFullYear()
    if (!years.length || years[years.length - 1].year !== y) years.push({ year: y, posts: [] })
    years[years.length - 1].posts.push(p)
  }
  const body = `
  ${pageHead({ kicker: 'ARCHIVE', title: '全部记录', lead: `${posts.length} 条记录，按时间倒序沉在水底。` })}
  <div class="archive">
    ${years.map((g) => `<section class="arch-year">
      <h2 class="arch-year-title"><span>${g.year}</span><em>${g.posts.length} records</em></h2>
      <ul class="arch-list">
        ${g.posts.map((p, i) => `<li style="--i:${i}">
          <a href="${url(`/posts/${p.slug}/`)}">
            <time>${fmtDate(p.date)}</time>
            <b>${escapeHtml(p.title)}</b>
            <span class="arch-tags">${p.tagItems.map((t) => escapeHtml(t.label)).join(' / ')}</span>
            <span class="arch-go">${arrow}</span>
          </a>
        </li>`).join('')}
      </ul>
    </section>`).join('')}
  </div>`
  return layout({ title: '归档', description: `${config.title} 的全部文章归档`, path: '/archive/', active: '/archive/', bodyClass: 'page-archive', postsCount: posts.length, dev, body })
}

/* ---------------- 标签 ---------------- */

export function renderTagsIndex({ groups, posts, dev }) {
  const body = `
  ${pageHead({ kicker: 'TAROT', title: '标签', lead: '每一条记录都属于某个牌组。' })}
  <div class="tag-wall">
    ${groups.map((g, i) => `<a class="tag-card" style="--i:${i}" href="${url(`/tags/${g.key}/`)}">
      <span class="tc-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="tc-label">${escapeHtml(g.label)}</span>
      <span class="tc-key">${escapeHtml(g.key)}</span>
      <span class="tc-count">${g.posts.length}</span>
    </a>`).join('')}
  </div>`
  return layout({ title: '标签', path: '/tags/', active: '/tags/', bodyClass: 'page-tags', postsCount: posts.length, dev, body })
}

export function renderTagPage({ group, posts, dev }) {
  const body = `
  ${pageHead({ kicker: `TAG / ${group.key}`, title: group.label, lead: `共 ${group.posts.length} 条记录` })}
  <div class="card-list">${group.posts.map((p, i) => postCard(p, { index: i })).join('')}</div>
  <p class="back-line"><a href="${url('/tags/')}">← 回到标签墙</a></p>`
  return layout({ title: `标签：${group.label}`, path: `/tags/${group.key}/`, active: '/tags/', bodyClass: 'page-tag', postsCount: posts.length, dev, body })
}

/* ---------------- 普通页面 / 404 ---------------- */

export function renderPage({ page, posts, dev }) {
  const meta = page.date ? `<time datetime="${fmtDateIso(page.date)}">${fmtDate(page.date)}</time>` : ''
  const body = `
  <article class="post">
    ${pageHead({ kicker: page.latin || 'PAGE', latin: page.latin, title: page.title, meta })}
    <div class="post-grid">${tocBlock(page.toc)}<div class="prose">${page.html}</div></div>
  </article>`
  return layout({ title: page.title, description: page.description, path: `/${page.slug}/`, active: `/${page.slug}/`, bodyClass: 'page-static', postsCount: posts.length, dev, body })
}

export function render404({ posts, dev }) {
  const body = `<section class="nf">
  <p class="nf-code">404</p>
  <h1 class="nf-title"><span>这个页面</span><b>还没有浮出水面</b></h1>
  <p class="nf-desc">你走入了不存在的走廊。回去比较安全。</p>
  <a class="btn btn--solid" href="${url('/')}">回到首页 ${arrow}</a>
</section>`
  return layout({ title: '404', path: '/404.html', bodyClass: 'page-404', postsCount: posts.length, dev, body })
}

/* ---------------- feed / sitemap ---------------- */

export function renderFeed({ posts }) {
  const items = posts.slice(0, config.feed?.limit ?? 20).map((p) => `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${absUrl(`/posts/${p.slug}/`)}</link>
      <guid isPermaLink="true">${absUrl(`/posts/${p.slug}/`)}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeHtml(p.description)}</description>
    </item>`).join('')
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.title)}</title>
    <link>${absUrl('/')}</link>
    <atom:link href="${absUrl('/feed.xml')}" rel="self" type="application/rss+xml"/>
    <description>${escapeHtml(config.description)}</description>
    <language>${config.locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`
}

export function renderSitemap({ posts, pages }) {
  const loc = [absUrl('/'), absUrl('/archive/'), absUrl('/tags/'), ...pages.map((p) => absUrl(`/${p.slug}/`)), ...posts.map((p) => absUrl(`/posts/${p.slug}/`))]
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${loc.map((l) => `  <url><loc>${escapeHtml(l)}</loc></url>`).join('\n')}
</urlset>`
}
