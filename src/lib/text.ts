/**
 * 纯文本 / 日期工具。
 * 这里**不能**出现 import.meta.env：astro.config.ts 会经由 headings.ts 引到本文件，
 * 而配置文件是被 esbuild 打包成 Node 代码的。
 */

/** 中日韩字符区间（用码位写，避免正则里塞字面汉字被编辑器改写） */
const CJK_RANGES: [number, number][] = [
  [0x3000, 0x30ff], // 标点与假名
  [0x4e00, 0x9fff], // 统一表意文字
  [0xf900, 0xfaff], // 兼容表意文字
]

export function isCjk(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0
  return CJK_RANGES.some(([a, b]) => code >= a && code <= b)
}

/** 保留 \w、连字符与中日韩字符，其余压成 - */
export function slugify(s: string): string {
  const out = Array.from(String(s).normalize('NFKD').toLowerCase())
    .map((ch) => (/[\w-]/.test(ch) || isCjk(ch) ? ch : '-'))
    .join('')
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** 1 -> I，4 -> IV（卡片左上角那种罗马数字角标） */
export function roman(n: number): string {
  if (!Number.isFinite(n) || n < 1 || n > 39) return String(n)
  let out = ''
  let rest = n
  for (const [v, s] of ROMAN) {
    while (rest >= v) {
      out += s
      rest -= v
    }
  }
  return out
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const pad = (n: number) => String(n).padStart(2, '0')

/** 2026-09-30 */
export const fmtDate = (d: Date): string => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`

/** SEP 30, 2026 */
export const fmtDateLatin = (d: Date): string => `${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()}`

/** 阅读时长：中日韩按字计，其他按词计 */
export function readingMinutes(text: string): number {
  let cjk = 0
  let latin = ''
  for (const ch of text) {
    if (isCjk(ch)) cjk += 1
    else latin += ch
  }
  const words = (latin.match(/[A-Za-z0-9_'-]+/g) || []).length
  return Math.max(1, Math.round(cjk / 380 + words / 200))
}

/** 从 Markdown 正文抽纯文本摘要 */
export function excerpt(markdown: string, len = 88): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > len ? `${text.slice(0, len)}…` : text
}
