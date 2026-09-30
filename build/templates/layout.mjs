import { config, url, absUrl } from '../context.mjs'
import { escapeHtml, fmtDateLatin, roman } from '../lib/util.mjs'

const NIGHT_BOOTSTRAP = `
<script>(function(){try{var n=localStorage.getItem('p3-night');if(n===null)n=window.matchMedia('(prefers-color-scheme: dark)').matches?'1':'0';if(n==='1')document.documentElement.setAttribute('data-theme','night');}catch(e){}})();</script>
`

const LIVE_RELOAD = `
<script>
(function(){
  if (!window.EventSource) return;
  var es = new EventSource('/__livereload');
  es.addEventListener('reload', function(){ es.close(); location.reload(); });
  es.onerror = function(){ es.close(); };
})();
</script>
`

function navItems(active) {
  return config.nav
    .map((item) => {
      const href = url(item.href)
      const isOn = item.href === active || (item.href !== '/' && active.startsWith(item.href))
      return `<a class="nav-item${isOn ? ' is-on' : ''}" href="${href}">
        <span class="nav-latin">${escapeHtml(item.latin || '')}</span>
        <span class="nav-label">${escapeHtml(item.label)}</span>
      </a>`
    })
    .join('')
}

function footer({ postsCount }) {
  const social = (config.social || [])
    .map((s) => `<a href="${url(s.url)}" rel="me">${escapeHtml(s.label)}</a>`)
    .join('')
  return `
<footer class="site-foot">
  <div class="foot-inner">
    <div class="foot-mori">
      <span class="foot-rule"></span>
      <span class="foot-mori-text">MEMENTO&nbsp;MORI</span>
      <span class="foot-rule"></span>
    </div>
    <div class="foot-cols">
      <p class="foot-copy">© ${new Date().getFullYear()} ${escapeHtml(config.author)} · 记住终将逝去的东西</p>
      <p class="foot-links">${social}</p>
      <p class="foot-meta"><span>${postsCount} 条记录</span> · <span>PHASE ${String(postsCount).padStart(3, '0')}</span> · <span>${fmtDateLatin(new Date())}</span></p>
    </div>
  </div>
</footer>`
}

export function layout({ title, description, body = '', path: pagePath = '/', active = '/', bodyClass = '', postsCount = 0, dev = false, head = '' }) {
  const fullTitle = title ? `${title} · ${config.title}` : `${config.latinTitle} · ${config.title}`
  const desc = description || config.description
  const canonical = absUrl(pagePath)
  return `<!doctype html>
<html lang="${config.locale || 'zh-CN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="author" content="${escapeHtml(config.author)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${absUrl('/assets/abyss.jpg')}">
<meta name="theme-color" content="#04101f">
<link rel="icon" href="${url('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.title)}" href="${url('/feed.xml')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,600;0,800;0,900;1,400;1,600;1,800;1,900&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+SC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="${url('/assets/main.css')}">
${NIGHT_BOOTSTRAP}${head}
</head>
<body class="${bodyClass}" data-posts="${postsCount}">
<div class="sea" aria-hidden="true">
  <div class="sea-surface"></div>
  <div class="sea-rays"></div>
  <div class="sea-vignette"></div>
  <div class="sea-grain"></div>
</div>

<div class="glyphs" aria-hidden="true"><b>${escapeHtml(config.latinTitle)}</b></div>

<div class="veil" aria-hidden="true"><i></i><i></i><i></i></div>

<a class="skip" href="#main">跳到正文</a>

<header class="site-head">
  <a class="brand" href="${url('/')}">
    <span class="brand-moon" aria-hidden="true"></span>
    <span class="brand-text">
      <b>${escapeHtml(config.latinTitle)}</b>
      <i>${escapeHtml(config.title)}</i>
    </span>
  </a>
  <nav id="site-nav" class="site-nav" aria-label="主导航">${navItems(active)}</nav>
  <div class="head-tools">
    <time class="dark-clock" id="dark-clock" title="Dark Hour 时钟">--:--</time>
    <button class="night-btn" id="night-toggle" type="button" aria-pressed="false" title="当前：浅色模式">
      <span class="nb-disc" aria-hidden="true"></span>
      <span class="nb-text">LIGHT</span>
    </button>
    <button class="menu-btn" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">MENU</button>
  </div>
</header>

<div class="moon-progress" aria-hidden="true">
  <span class="mp-label">MOON</span>
  <span class="moon-disc"><i class="moon-shadow"></i></span>
  <span class="mp-track"><i class="mp-fill"></i></span>
</div>

<main id="main" class="site-main">
${body}
</main>

${footer({ postsCount })}
<script src="${url('/assets/client.js')}" defer></script>
${dev ? LIVE_RELOAD : ''}
</body>
</html>`
}

export function pageHead({ kicker = '', latin = '', title, meta = '', actions = '', lead = '' }) {
  return `<div class="page-head">
  <p class="kicker"><span class="kicker-tick"></span>${escapeHtml(kicker)}</p>
  <h1 class="page-title">
    ${latin ? `<span class="page-title-latin">${escapeHtml(latin)}</span>` : ''}
    <span class="page-title-main">${escapeHtml(title)}</span>
  </h1>
  ${meta ? `<div class="page-meta">${meta}</div>` : ''}
  ${lead ? `<p class="page-lead">${escapeHtml(lead)}</p>` : ''}
  ${actions ? `<div class="page-actions">${actions}</div>` : ''}
</div>`
}

export function postCard(p, { index = 0, variant = 'row' } = {}) {
  const href = url(`/posts/${p.slug}/`)
  const tags = p.tagItems.map((t) => `<a class="chip" href="${url(`/tags/${t.key}/`)}">${escapeHtml(t.label)}</a>`).join('')
  const sub = escapeHtml(p.latin || p.tagItems.map((t) => t.label).join(' / ') || 'RECORD')
  return `<article class="card card--${variant}" style="--i:${index}">
  <div class="card-side">
    <span class="card-roman" aria-hidden="true">${roman(index + 1)}</span>
    <span class="card-num">${String(index + 1).padStart(2, '0')}</span>
    <time class="card-date" datetime="${p.date.toISOString().slice(0, 10)}">${fmtDateLatin(p.date)}</time>
    <span class="card-sub">${sub}</span>
  </div>
  <div class="card-body">
    <h2 class="card-title"><a href="${href}">${escapeHtml(p.title)}</a></h2>
    ${p.latin ? `<p class="card-latin">${escapeHtml(p.latin)}</p>` : ''}
    <p class="card-desc">${escapeHtml(p.description)}</p>
    <div class="card-foot">
      <span class="card-tags">${tags}</span>
      <span class="card-meta">${p.minutes} min</span>
      <a class="card-more" href="${href}">READ <i>▸</i></a>
    </div>
  </div>
</article>`
}
