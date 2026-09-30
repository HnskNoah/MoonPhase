/** 站点信息：改这里就能换成你自己的站 */
export const config = {
  title: '月相记录',
  latinTitle: 'MOON PHASE',
  subtitle: '深青之海里的个人博客',
  description: '一个女神异闻录3风格的个人博客：技术、设计与生活记录。在 0:00 之后，把想法沉入水底再看清一次。',
  author: 'HnskNoah',
  locale: 'zh-CN',
  nav: [
    { label: '首页', latin: 'PHASE', href: '/' },
    { label: '归档', latin: 'ARCHIVE', href: '/archive/' },
    { label: '标签', latin: 'TAROT', href: '/tags/' },
    { label: '关于', latin: 'ABOUT', href: '/about/' },
  ],
  social: [
    { label: 'GITHUB', url: 'https://github.com/HnskNoah' },
    { label: 'RSS', url: '/rss.xml' },
  ],
  /** 中文标签 -> URL 里用的 ASCII key；没登记的标签走 slugify */
  tagKeys: {
    技术: 'tech',
    设计: 'design',
    随笔: 'essay',
    阅读: 'reading',
    记录: 'log',
    复盘: 'retro',
  } as Record<string, string>,
  /** 分页大小：上百篇之后归档与标签页靠它 */
  pagination: { archive: 30, tag: 20, home: 5 },
  feedLimit: 20,
} as const
