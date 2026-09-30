export function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

export function stripHtml(s = '') {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function slugify(s = '') {
  return String(s)
    .normalize('NFKD')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function toDate(value) {
  if (value instanceof Date) return value
  const d = new Date(String(value) + (String(value).length <= 10 ? 'T00:00:00' : ''))
  return isNaN(d) ? new Date(0) : d
}

/** 2026-09-30 -> "2026.09.30" */
export function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/** 2026-09-30 -> "SEP 30, 2026" */
export function fmtDateLatin(d) {
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

export function fmtDateIso(d) {
  return d instanceof Date ? d.toISOString() : toDate(d).toISOString()
}

/** 阅读时长：中日韩按字计，其他按词计 */
export function readingMinutes(text = '') {
  const cjk = (text.match(/[\u3000-\u30ff\u4e00-\u9fff\uf900-\ufaff]/g) || []).length
  const words = (text.replace(/[\u3000-\u30ff\u4e00-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9_'’-]+/g) || []).length
  return Math.max(1, Math.round(cjk / 380 + words / 200))
}

/**
 * 给 marked 输出的 h2-h4 补 id，同时收集目录。
 * 不用 marked 版本相关的 renderer API，避免升级破坏。
 */
export function injectHeadingIds(html) {
  const toc = []
  let n = 0
  const used = new Set()
  const out = html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    n += 1
    let id = `s-${n}-${slugify(stripHtml(inner)).slice(0, 40)}`
    while (used.has(id)) id += 'x'
    used.add(id)
    toc.push({ level: Number(level), id, text: stripHtml(inner) })
    return `<h${level} id="${id}">${inner}<a class="heading-anchor" href="#${id}" aria-label="锚点链接">#</a></h${level}>`
  })
  return { html: out, toc }
}

/** Markdown 正文里抽取纯文本摘要 */
export function excerpt(markdown = '', len = 88) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^---[\s\S]*?---/g, ' ')
    .replace(/![[\s\S]*?\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > len ? text.slice(0, len) + '…' : text
}
