/* ==========================================================================
   月相记录 · 客户端交互
   水下波光 canvas / 月相与进度 / Dark Hour 时钟 / 双主题 / 页面水幕转场
   ========================================================================== */
;(() => {
  'use strict'

  const root = document.documentElement
  const body = document.body
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim()

  /* ---------- 月相 ---------- */
  const SYNODIC = 29.530588853
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 已知新月
  const PHASES = [
    { until: 0.03, name: '新月', latin: 'NEW MOON' },
    { until: 0.22, name: '娥眉月', latin: 'WAXING CRESCENT' },
    { until: 0.28, name: '上弦月', latin: 'FIRST QUARTER' },
    { until: 0.47, name: '盈凸月', latin: 'WAXING GIBBOUS' },
    { until: 0.53, name: '满月', latin: 'FULL MOON' },
    { until: 0.72, name: '亏凸月', latin: 'WANING GIBBOUS' },
    { until: 0.78, name: '下弦月', latin: 'LAST QUARTER' },
    { until: 0.97, name: '残月', latin: 'WANING CRESCENT' },
  ]

  function moonPhase(date = new Date()) {
    const days = (date.getTime() - NEW_MOON) / 86400000
    let p = (days % SYNODIC) / SYNODIC
    if (p < 0) p += 1
    const illum = Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100)
    const phase = PHASES.find((x) => p < x.until) || PHASES[0]
    return { p, illum, name: phase.name, latin: phase.latin }
  }

  function paintMoon() {
    const m = moonPhase()
    // --moon: 阴影位移百分比。p=0.5（满月）时完全移出
    const shift = m.p <= 0.5 ? m.p * 200 : (1 - m.p) * 200
    root.style.setProperty('--moon', shift.toFixed(1))
    const disc = document.querySelector('.moon-shadow')
    if (disc) disc.style.transform = m.p < 0.5 ? `translateX(${shift}%)` : `translateX(-${shift}%)`
    const nameEl = document.querySelector('.moon-name')
    if (nameEl) nameEl.textContent = `${m.name} · ${m.illum}%`
    const dateEl = document.querySelector('.stat-date')
    if (dateEl) {
      const d = new Date()
      dateEl.textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }
    const countEl = document.querySelector('.stat-count')
    if (countEl) {
      const n = document.querySelectorAll('.card, .arch-list li').length
      const total = document.body.dataset.posts
      if (total) countEl.textContent = String(total).padStart(2, '0')
      else if (n) countEl.textContent = String(n).padStart(2, '0')
    }
  }

  /* ---------- 水下波光 + 气泡 ---------- */
  function startCaustics() {
    const canvas = document.getElementById('caustics')
    if (!canvas || reduced) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let w = 0,
      h = 0,
      dpr = 1,
      bubbles = [],
      tick = 0,
      raf = 0,
      last = 0
    let rgb = '130, 205, 255'

    function readColor() {
      const hex = cssVar('--accent') || '#4fcbff'
      const m = hex.replace('#', '')
      const v =
        m.length === 3
          ? m
              .split('')
              .map((c) => c + c)
              .join('')
          : m
      const n = parseInt(v.slice(0, 6), 16)
      if (!Number.isNaN(n)) rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(14, Math.round(w / 78))
      bubbles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.7 + Math.random() * 2.6,
        v: 0.12 + Math.random() * 0.45,
        a: 0.05 + Math.random() * 0.3,
        s: Math.random() * Math.PI * 2,
      }))
    }

    function draw(now) {
      raf = requestAnimationFrame(draw)
      if (now - last < 33) return // ~30fps
      const t = (tick += 0.006)
      last = now
      ctx.clearRect(0, 0, w, h)

      // 焦散：横向正弦光带，越靠上越密
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 7; i++) {
        const base = h * (0.06 + i * 0.11)
        ctx.beginPath()
        for (let x = -40; x <= w + 40; x += 22) {
          const y =
            base + Math.sin(x * 0.0042 + t * (1.6 + i * 0.35) + i) * (16 + i * 5) + Math.sin(x * 0.011 - t * 2.2) * 5
          if (x === -40) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${rgb}, ${0.045 + (7 - i) * 0.008})`
        ctx.lineWidth = 1 + (7 - i) * 0.35
        ctx.shadowColor = `rgba(${rgb}, .5)`
        ctx.shadowBlur = 18
        ctx.stroke()
      }
      ctx.shadowBlur = 0

      // 上浮的气泡
      for (const b of bubbles) {
        b.y -= b.v
        b.x += Math.sin((b.y + b.s * 40) * 0.012) * 0.35
        if (b.y < -8) {
          b.y = h + 8
          b.x = Math.random() * w
        }
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${rgb}, ${b.a})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    readColor()
    resize()
    draw(performance.now())
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf)
      if (document.hidden) return
      last = 0
      raf = requestAnimationFrame(draw)
    })
    window.addEventListener('p3-theme', () => {
      readColor()
    })
  }

  /* ---------- 主题：深渊 / Dark Hour ---------- */
  const THEME_KEY = 'p3-theme'
  const btn = document.getElementById('theme-toggle')

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme)
    if (btn) {
      const on = theme === 'darkhour'
      btn.setAttribute('aria-pressed', String(on))
      const key = btn.querySelector('.theme-btn-key')
      if (key) key.textContent = on ? 'DAYLIGHT' : 'DARK\u00a0HOUR'
    }
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme)
      } catch {
        /* 隐私模式忽略 */
      }
    }
    window.dispatchEvent(new CustomEvent('p3-theme'))
  }

  function initTheme() {
    let saved = null
    try {
      saved = localStorage.getItem(THEME_KEY)
    } catch {
      /* noop */
    }
    applyTheme(saved || root.getAttribute('data-theme') || 'abyss', false)
    if (btn)
      btn.addEventListener('click', () => {
        applyTheme(root.getAttribute('data-theme') === 'darkhour' ? 'abyss' : 'darkhour', true)
      })
  }

  /* ---------- Dark Hour 时钟：0:00 自动入夜 ---------- */
  function initClock() {
    const el = document.getElementById('dark-clock')
    if (!el) return
    const pad = (n) => String(n).padStart(2, '0')
    const update = () => {
      const d = new Date()
      el.textContent = `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      const isDark = d.getHours() === 0
      el.classList.toggle('is-dark', isDark)
      el.title = isDark ? 'DARK HOUR — 第十二个时段' : '当前时间'
      if (isDark) {
        let saved = null
        try {
          saved = localStorage.getItem(THEME_KEY)
        } catch {
          /* noop */
        }
        if (!saved) applyTheme('darkhour', false)
      }
    }
    update()
    setInterval(update, 1000)
  }

  /* ---------- 阅读进度 ---------- */
  function initProgress() {
    const wrap = document.querySelector('.moon-progress')
    if (!wrap) return
    let queued = false
    const paint = () => {
      queued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
      wrap.style.setProperty('--scroll', pct.toFixed(1) + '%')
    }
    addEventListener(
      'scroll',
      () => {
        if (!queued) {
          queued = true
          requestAnimationFrame(paint)
        }
      },
      { passive: true },
    )
    paint()
  }

  /* ---------- 目录高亮 ---------- */
  function initTocSpy() {
    const links = [...document.querySelectorAll('.toc a')]
    if (!links.length || !('IntersectionObserver' in window)) return
    const map = new Map()
    links.forEach((a) => {
      const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))
      if (target) map.set(target, a)
    })
    let active = null
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (active) active.classList.remove('is-active')
          active = map.get(e.target)
          if (active) active.classList.add('is-active')
        }
      },
      { rootMargin: '-84px 0px -68% 0px', threshold: [0, 1] },
    )
    map.forEach((_a, el) => io.observe(el))
  }

  /* ---------- 移动端导航 ---------- */
  function initMenu() {
    const toggle = document.getElementById('menu-toggle')
    if (!toggle) return
    toggle.addEventListener('click', () => {
      const open = body.classList.toggle('nav-open')
      toggle.setAttribute('aria-expanded', String(open))
    })
    document
      .querySelectorAll('.site-nav a')
      .forEach((a) => a.addEventListener('click', () => body.classList.remove('nav-open')))
  }

  /* ---------- 水幕转场 ---------- */
  function initVeil() {
    if (reduced) return
    document.querySelectorAll('a[href]').forEach((a) => {
      if (a.target || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || !href.startsWith('/')) return
      if (a.classList.contains('heading-anchor') || a.classList.contains('skip')) return
      a.addEventListener('click', (ev) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return
        ev.preventDefault()
        body.classList.add('is-leaving')
        setTimeout(() => {
          window.location.href = href
        }, 300)
      })
    })
    if (sessionStorage.getItem('p3-enter') === '1') {
      body.classList.add('is-entering')
      setTimeout(() => body.classList.remove('is-entering'), 620)
    }
    addEventListener('pageshow', () => sessionStorage.setItem('p3-enter', '1'))
    addEventListener('pagehide', () => body.classList.remove('is-leaving'))
  }

  /* ---------- boot ---------- */
  function boot() {
    initTheme()
    initClock()
    initMenu()
    initProgress()
    initTocSpy()
    initVeil()
    paintMoon()
    startCaustics()
    body.classList.add('is-ready')
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot)
  else boot()
})()
