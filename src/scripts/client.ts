/* ==========================================================================
   月相记录 · 客户端交互
   月相与阅读进度 / Dark Hour 时钟 / 目录高亮 / 移动菜单 / 夜间模式
   ========================================================================== */

interface MoonPhase {
  /** 0~1 相位 */
  p: number
  /** 亮度百分比 */
  illum: number
  name: string
  latin: string
}

const SYNODIC = 29.530588853
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 一次已知新月
const PHASES: { until: number; name: string; latin: string }[] = [
  { until: 0.03, name: '新月', latin: 'NEW MOON' },
  { until: 0.22, name: '娥眉月', latin: 'WAXING CRESCENT' },
  { until: 0.28, name: '上弦月', latin: 'FIRST QUARTER' },
  { until: 0.47, name: '盈凸月', latin: 'WAXING GIBBOUS' },
  { until: 0.53, name: '满月', latin: 'FULL MOON' },
  { until: 0.72, name: '亏凸月', latin: 'WANING GIBBOUS' },
  { until: 0.78, name: '下弦月', latin: 'LAST QUARTER' },
  { until: 0.97, name: '残月', latin: 'WANING CRESCENT' },
]

const root = document.documentElement
const body = document.body

function moonPhase(date: Date = new Date()): MoonPhase {
  const days = (date.getTime() - NEW_MOON) / 86400000
  let p = (days % SYNODIC) / SYNODIC
  if (p < 0) p += 1
  const illum = Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100)
  const phase = PHASES.find((x) => p < x.until) ?? PHASES[0]
  return { p, illum, name: phase.name, latin: phase.latin }
}

/** 品牌徽标、首页圆框、左侧月相轨共用同一个相位 */
function paintMoon(): void {
  const m = moonPhase()
  const shift = m.p <= 0.5 ? m.p * 200 : (1 - m.p) * 200
  const dir = m.p < 0.5 ? 1 : -1

  const rail = document.querySelector<SVGCircleElement>('.moon-shadow')
  if (rail) rail.style.transform = `translateX(${dir * shift}%)`

  // 位移按各自 SVG 的用户单位换算（盘面直径）
  for (const [id, d] of [
    ['bm-shadow', 21],
    ['hp-shadow', 32],
    ['hp-rim', 31.4],
  ] as const) {
    const el = document.getElementById(id) as SVGCircleElement | null
    if (el) el.style.transform = `translateX(${((dir * shift) / 100) * d}px)`
  }

  const nameEl = document.querySelector('.moon-name')
  if (nameEl) nameEl.textContent = `${m.name} · ${m.illum}%`

  const dateEl = document.querySelector('.stat-date')
  if (dateEl) {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    dateEl.textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  }

  const countEl = document.querySelector('.stat-count')
  if (countEl) countEl.textContent = String(body.dataset.posts ?? '0').padStart(2, '0')
}

/* ---------- 夜间模式 ---------- */
const NIGHT_KEY = 'p3-night'

function isNight(): boolean {
  return root.getAttribute('data-theme') === 'night'
}

function syncNightBtn(): void {
  const btn = document.getElementById('night-toggle')
  if (!(btn instanceof HTMLButtonElement)) return
  btn.setAttribute('aria-pressed', String(isNight()))
  btn.title = isNight() ? '当前：夜间模式' : '当前：浅色模式'
  const text = btn.querySelector('.nb-text')
  if (text) text.textContent = isNight() ? 'NIGHT' : 'LIGHT'
}

function initNight(): void {
  syncNightBtn()
  const btn = document.getElementById('night-toggle')
  if (!btn) return
  btn.addEventListener('click', () => {
    if (isNight()) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', 'night')
    try {
      localStorage.setItem(NIGHT_KEY, isNight() ? '1' : '0')
    } catch {
      /* 隐私模式下只是不记忆 */
    }
    syncNightBtn()
  })
}

/* ---------- Dark Hour 时钟 ---------- */
function initClock(): void {
  const el = document.getElementById('dark-clock')
  if (!el) return
  const pad = (n: number) => String(n).padStart(2, '0')
  const update = () => {
    const d = new Date()
    el.textContent = `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const dark = d.getHours() === 0
    el.classList.toggle('is-dark', dark)
    el.title = dark ? 'DARK HOUR — 第十二个时段' : '当前时间'
  }
  update()
  setInterval(update, 1000)
}

/* ---------- 阅读进度 ---------- */
function initProgress(): void {
  const wrap = document.querySelector<HTMLElement>('.moon-progress')
  if (!wrap) return
  let queued = false
  const paint = () => {
    queued = false
    const max = document.documentElement.scrollHeight - window.innerHeight
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
    wrap.style.setProperty('--scroll', `${pct.toFixed(1)}%`)
  }
  window.addEventListener(
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
function initTocSpy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')]
  if (links.length === 0 || !('IntersectionObserver' in window)) return
  const map = new Map<HTMLElement, HTMLAnchorElement>()
  for (const a of links) {
    const href = a.getAttribute('href')
    if (!href || !href.startsWith('#')) continue
    const target = document.getElementById(decodeURIComponent(href.slice(1)))
    if (target) map.set(target, a)
  }
  let active: HTMLAnchorElement | null = null
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        active?.classList.remove('is-active')
        active = map.get(e.target as HTMLElement) ?? null
        active?.classList.add('is-active')
      }
    },
    { rootMargin: '-84px 0px -68% 0px', threshold: [0, 1] },
  )
  map.forEach((_a, el) => io.observe(el))
}

/* ---------- 移动端导航 ---------- */
function initMenu(): void {
  const toggle = document.getElementById('menu-toggle')
  if (!toggle) return
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open')
    toggle.setAttribute('aria-expanded', String(open))
  })
  for (const a of document.querySelectorAll<HTMLAnchorElement>('.site-nav a')) {
    a.addEventListener('click', () => body.classList.remove('nav-open'))
  }
}

function boot(): void {
  initClock()
  initNight()
  initMenu()
  initProgress()
  initTocSpy()
  paintMoon()
  body.classList.add('is-ready')
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot)
else boot()
