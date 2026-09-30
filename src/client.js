/* ==========================================================================
   月相记录 · 客户端交互
   月相与阅读进度 / Dark Hour 时钟 / 目录高亮 / 移动菜单 / 水波转场
   ========================================================================== */
;(() => {
  'use strict'

  const root = document.documentElement
  const body = document.body
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
    // 阴影偏移：p=0.5（满月）时完全移出
    const shift = m.p <= 0.5 ? m.p * 200 : (1 - m.p) * 200
    const dir = m.p < 0.5 ? 1 : -1
    const shadow = document.querySelector('.moon-shadow')
    if (shadow) shadow.style.transform = `translateX(${dir * shift}%)`

    // 品牌徽标共用同一个相位：位移按 SVG 用户单位换算（盘面直径 21）
    const bm = document.getElementById('bm-shadow')
    if (bm) bm.style.transform = `translateX(${((dir * shift) / 100) * 21}px)`

    const nameEl = document.querySelector('.moon-name')
    if (nameEl) nameEl.textContent = `${m.name} · ${m.illum}%`

    const dateEl = document.querySelector('.stat-date')
    if (dateEl) {
      const d = new Date()
      dateEl.textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }

    const countEl = document.querySelector('.stat-count')
    if (countEl) countEl.textContent = String(body.dataset.posts || '0').padStart(2, '0')
  }

  /* ---------- Dark Hour 时钟 ---------- */
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
    }
    update()
    setInterval(update, 1000)
  }

  /* ---------- 夜间模式 ---------- */
  const NIGHT_KEY = 'p3-night'

  function syncNightBtn() {
    const btn = document.getElementById('night-toggle')
    if (!btn) return
    const night = root.getAttribute('data-theme') === 'night'
    btn.setAttribute('aria-pressed', String(night))
    btn.title = night ? '当前：夜间模式' : '当前：浅色模式'
    const text = btn.querySelector('.nb-text')
    if (text) text.textContent = night ? 'NIGHT' : 'LIGHT'
  }

  function initNight() {
    const btn = document.getElementById('night-toggle')
    syncNightBtn()
    if (!btn) return
    btn.addEventListener('click', () => {
      const night = root.getAttribute('data-theme') === 'night'
      if (night) root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', 'night')
      try {
        localStorage.setItem(NIGHT_KEY, night ? '0' : '1')
      } catch {
        /* 隐私模式忽略 */
      }
      syncNightBtn()
    })
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

  /* ---------- 水波转场 ---------- */
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
    initClock()
    initNight()
    initMenu()
    initProgress()
    initTocSpy()
    initVeil()
    paintMoon()
    body.classList.add('is-ready')
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot)
  else boot()
})()
