import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as userConfig } from '../site.config.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** base 归一化成 `/` 或 `/仓库名/`（GitHub Pages 的前缀永远只有一段） */
function normalizeBase(input) {
  const cleaned = String(input || '/').trim().replace(/\\/g, '/').replace(/^https?:\/\/[^/]+/, '')
  const seg = cleaned
    .split('/')
    .map((s) => s.replace(/[^A-Za-z0-9._~-]/g, ''))
    .filter(Boolean)
    .pop()
  if (seg && seg !== cleaned.replace(/^\/+|\/+$/g, '')) {
    console.warn(`! BASE_PATH "${input}" 不是预期的仓库名，已按 /${seg}/ 处理`)
  }
  return seg ? `/${seg}/` : '/'
}

export const config = { ...userConfig, base: normalizeBase(process.env.BASE_PATH || userConfig.base) }

export function url(p = '/') {
  if (/^(https?:|mailto:|\/\/|#)/.test(p)) return p
  return config.base + String(p).replace(/^\/+/, '')
}

/** feed / sitemap 需要绝对地址；在 Actions 里用 SITE_ORIGIN 注入 */
export function absUrl(p = '/') {
  const origin = (process.env.SITE_ORIGIN || '').replace(/\/+$/, '')
  if (!origin) return url(p)
  return origin + url(p)
}

/** 从当前页面 depth 出发回到站点根的相对前缀，用于 404 之类的兜底 */
export function rootPrefix(depth) {
  return '../'.repeat(depth)
}
