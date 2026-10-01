/**
 * Markdown 正文里的 `{{key}}` 占位符替换，值来自 src/consts.ts。
 * 目的只有一个：作者名、站名这类东西以后只改 consts，不用回去翻文章。
 */

interface MdLike {
  type: string
  value?: unknown
  url?: string
  children?: MdLike[]
}

const TOKEN = /\{\{\s*([\w.-]+)\s*\}\}/g

/** 只替换认得的键；认不出的原样留着，免得把正文里的花括号吞掉还查不出来 */
function fill(input: string, vars: Record<string, string>): string {
  return input.replace(TOKEN, (whole, key: string) => (key in vars ? vars[key] : whole))
}

export function remarkPlaceholders(vars: Record<string, string> = {}) {
  return (tree: import('mdast').Root) => {
    const walk = (node: MdLike) => {
      // 代码块里的 {{...}} 通常是示例或反例，动它只会让人看不懂 diff
      if (node.type === 'code') return
      // inlineCode 要替换：像 `92558602+{{author}}@users.noreply.github.com` 这种邮箱就是正文
      if (node.type === 'text' || node.type === 'inlineCode') node.value = fill(String(node.value ?? ''), vars)
      if (node.type === 'link' || node.type === 'image') node.url = fill(String(node.url ?? ''), vars)
      for (const child of node.children ?? []) walk(child)
    }
    walk(tree as unknown as MdLike)
  }
}
