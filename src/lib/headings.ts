import type { Root } from 'mdast'
import { slugify } from './text'

/** 标题 id 的唯一算法：插件和页面都从这里取，保证 TOC 锚点一定对得上 */
export function headingId(text: string, n: number): string {
  return `s-${n}-${slugify(text).slice(0, 40)}`
}

/**
 * 插件内部只看四件事：type / value / depth / children。
 * 不直接依赖 mdast 的联合类型，是为了递归时不用逐层做窄化。
 */
interface MdLike {
  type: string
  value?: string
  depth?: number
  children?: MdLike[]
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>
}

/** 取标题纯文本（链接、加粗、行内代码都只挖里面的文字） */
function mdText(node: MdLike): string {
  if (typeof node.value === 'string') return node.value
  return (node.children ?? []).map(mdText).join('')
}

/**
 * 给 h2-h4 补 id。Astro 默认不会给标题加锚点，没有它目录链接无处可跳。
 * 计数器每次处理一棵新树时重置，插件实例是跨文档复用的。
 */
export function remarkHeadingIds() {
  return (tree: Root) => {
    let n = 0
    const walk = (node: MdLike) => {
      const depth = node.depth ?? 99
      if (node.type === 'heading' && depth >= 2 && depth <= 4) {
        n += 1
        const id = headingId(mdText(node), n)
        node.data = { ...node.data, id, hProperties: { ...(node.data?.hProperties as object), id } }
      }
      for (const child of node.children ?? []) walk(child)
    }
    walk(tree as unknown as MdLike)
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
