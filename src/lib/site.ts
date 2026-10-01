import { config } from '../consts'
import { slugify } from './text'

export * from './text'

/** 站点前缀：项目站点是 /仓库名/，用户站点是 /。Astro 会注入 BASE_URL */
export const base: string = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')

/** 站内绝对路径 -> 带 base 前缀；外链、锚点、data URI 原样返回 */
export function u(path = '/'): string {
  if (/^(https?:|mailto:|\/\/|#|data:)/.test(path)) return path
  return `${base}/${String(path).replace(/^\/+/, '')}`
}

/** 标签在 URL 里用的 key */
export function tagKey(label: string): string {
  return config.tagKeys[label] || slugify(label) || encodeURIComponent(label)
}
