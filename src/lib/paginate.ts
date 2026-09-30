export interface PageInfo {
  page: number
  pages: number
  total: number
  size: number
  /** 上一页 URL，没有则 null */
  prev: string | null
  next: string | null
}

/**
 * 手动分页：归档与标签页在几百篇时必须切开，否则单个 HTML 会涨到上百 KB。
 * urlFor(页码) 由调用方给，避免这里知道路由形状。
 */
export function paginate<T>(items: T[], page: number, size: number, urlFor: (n: number) => string) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pages)
  const info: PageInfo = {
    page: current,
    pages,
    total: items.length,
    size,
    prev: current > 1 ? urlFor(current - 1) : null,
    next: current < pages ? urlFor(current + 1) : null,
  }
  return { slice: items.slice((current - 1) * size, current * size), info }
}
