import { slugify } from './text'

/** 标题 id 的唯一算法：插件和页面都从这里取，保证 TOC 锚点一定对得上 */
export function headingId(text: string, n: number): string {
  return `s-${n}-${slugify(text).slice(0, 40)}`
}

interface MdText {
  type: string
  value?: string
  children?: MdNode[]
}

interface MdNode {
  type: string
  depth?: number
  children?: MdNode[]
  data?: Record<string, unknown>
}

/** 取标题纯文本（跳过代码/链接的嵌套结构） */
export function mdText(node: MdNode | undefined): string {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  return (node.children ?? []).map(mdText).join('')
}

export function isTocHeading(node: MdNode): boolean {
  return node.type === 'heading' && (node.depth ?? 99) >= 2 && (node.depth ?? 99) <= 4
}

/**
 * 给 h2-h4 补 id。Astro 默认不会给标题加锚点，没有它目录链接无处可跳。
 * 计数器每次处理一棵新树时重置，插件实例是跨文档复用的。
 */
export function remarkHeadingIds() {
  return (tree: MdNode) => {
    let n = 0
    const walk = (node: MdNode) => {
      if (isTocHeading(node)) {
        n += 1
        const id = headingId(mdText(node), n)
        node.data = { ...node.data, id, hProperties: { ...(node.data?.hProperties as object), id } }
      }
      for (const child of node.children ?? []) walk(child)
    }
    walk(tree)
  }
}

/** 与 remarkHeadingIds 同序地生成目录 */
export function tocFromHeadings(
  headings: { depth: number; text: string }[],
): { level: number; id: string; text: string }[] {
  return headings
    .filter((h) => h.depth >= 2 && h.depth <= 4)
    .map((h, i) => ({ level: h.depth, id: headingId(h.text, i + 1), text: h.text }))
}
