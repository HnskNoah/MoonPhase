export const config = {
  title: '月相记录',
  latinTitle: 'MOON PHASE',
  subtitle: '深青之海里的个人博客',
  description: '一个女神异闻录3风格的个人博客：技术、设计与生活记录。在 0:00 之后，把想法沉入水底再看清一次。',
  author: '你的代号',
  // GitHub Pages: 项目站改成 '/仓库名/'，用户站保持 '/'
  base: '/',
  locale: 'zh-CN',
  // 默认界面主题：reload（正统 P3R）| abyss（水下霓虹）| darkhour（0:00 墨绿金）
  theme: 'reload',
  feed: { enabled: true, limit: 20 },
  social: [
    { label: 'GITHUB', url: 'https://github.com/your-name' },
    { label: 'RSS', url: 'feed.xml' },
  ],
  nav: [
    { label: '首页', latin: 'PHASE', href: '/' },
    { label: '归档', latin: 'ARCHIVE', href: '/archive/' },
    { label: '标签', latin: 'TAROT', href: '/tags/' },
    { label: '关于', latin: 'ABOUT', href: '/about/' },
  ],
  // 中文标签 -> 目录用的 ASCII key
  tagKeys: {
    技术: 'tech',
    设计: 'design',
    随笔: 'essay',
    阅读: 'reading',
    记录: 'log',
    复盘: 'retro',
  },
}
