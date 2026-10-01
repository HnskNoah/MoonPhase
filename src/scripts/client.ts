/* ==========================================================================
   月相记录 · 客户端交互
   月相与阅读进度 / Dark Hour 时钟 / 目录高亮 / 移动菜单 / 夜间模式
   ========================================================================== */

import { litPathD, moonPhase } from '../lib/moon'

const root = document.documentElement
const body = document.body

/** 品牌徽标、左侧月相轨、首页月亮共用同一个相位 */
function paintMoon(): void {
  const m = moonPhase()
  const shift = m.p <= 0.5 ? m.p * 200 : (1 - m.p) * 200
  // 影圆往哪边走：盈月（p<0.5）往左推 → 亮面露在右边，和下弦镜像。
  // 北半球口径，和 favicon 那个固定缺口（亮右）一致
  const dir = m.p < 0.5 ? -1 : 1

  const rail = document.querySelector<SVGCircleElement>('.moon-shadow')
  if (rail) rail.style.transform = `translateX(${dir * shift}%)`

  // 徽标阴影圆按自身 SVG 的用户单位换算（viewBox 32，盘面 r=10.5）
  const bm = document.getElementById('bm-shadow') as SVGCircleElement | null
  if (bm) bm.style.transform = `translateX(${((dir * shift) / 100) * 21}px)`

  // 首页月亮：亮面是「外沿半圆 + 半条椭圆终止线」，暗面交给地照光那一层
  const lit = document.getElementById('hm-litpath')
  if (lit) lit.setAttribute('d', litPathD(m.p))
  for (const id of ['hm-age-dark', 'hm-age-lit']) {
    const el = document.getElementById(id)
    if (el) el.textContent = String(m.age)
  }

  // 背景那轮圆盘按今晚亮度呼吸（覆盖 Layout 写在 <html> 上的构建期值）
  root.style.setProperty('--moon-lit', m.lit.toFixed(3))

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
