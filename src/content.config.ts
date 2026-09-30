import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/** 文章：frontmatter 写错字段名或日期格式会在构建时报错，而不是静默兜底 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    latin: z.string().default(''),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
  }),
})

/** 独立页面（关于等） */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    latin: z.string().default('PAGE'),
    slug: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
  }),
})

export const collections = { posts, pages }
