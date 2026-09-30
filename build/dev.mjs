import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { ROOT } from './context.mjs'
import { build } from './build.mjs'

const DIST = path.join(ROOT, process.env.OUTPUT_DIR || 'docs')
const PORT = Number(process.env.PORT || 4321)
const clients = new Set()

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
}

function send(res, code, body, type = 'text/html; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

function readFile(urlPath) {
  // 去掉 base 前缀，允许直接从浏览器路径访问
  const clean = decodeURIComponent(urlPath.split('?')[0])
  const candidates = [clean, `${clean}/index.html`, `${clean}.html`]
  for (const c of candidates) {
    const p = path.join(DIST, c)
    if (!p.startsWith(DIST)) continue
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  }
  return null
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || '/'

  if (urlPath === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write('retry: 500\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }

  let rel = urlPath.replace(/^\/+/, '')
  const baseNoSlash = (process.env.BASE_PATH || '/').replace(/^\/+|\/+$/g, '')
  if (baseNoSlash && rel.startsWith(baseNoSlash + '/')) rel = rel.slice(baseNoSlash.length + 1)
  const target = '/' + rel

  if (target === '/' || target === '') {
    const idx = path.join(DIST, 'index.html')
    if (fs.existsSync(idx)) return send(res, 200, fs.readFileSync(idx))
  }

  const file = readFile(target)
  if (file) return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream')

  const notFound = path.join(DIST, '404.html')
  if (fs.existsSync(notFound)) return send(res, 404, fs.readFileSync(notFound))
  send(res, 404, '404')
})

let timer = null
function rebuild(reason) {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    console.log(`\n↻ 重新构建（${reason}）`)
    try {
      await build({ dev: true })
      for (const c of clients) c.write('event: reload\ndata: 1\n\n')
    } catch (err) {
      console.error('✗ 构建失败：', err?.message || err)
    }
  }, 80)
}

await build({ dev: true })
server.listen(PORT, () => {
  console.log(`\n  ◉ Dark Hour 已开启`)
  console.log(`  本地预览  http://localhost:${PORT}/`)
  console.log(`  监听 content/ 与 src/；改 build/ 或 site.config.mjs 需要重启\n`)
})

let watching = false
for (const dir of ['content', 'src']) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) continue
  watching = true
  fs.watch(full, { recursive: true }, (_t, file) => rebuild(file || dir))
}
// 模板与配置是 ESM，进程内有模块缓存，改了必须重启才能生效
for (const dir of ['build', '.']) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) continue
  fs.watch(full, (_t, file) => {
    if (!file || !/\.(mjs|js)$/.test(file)) return
    if (file.startsWith('dev.')) return
    console.log(`\n! ${file} 变更：模板/构建脚本有模块缓存，请重启 npm run dev`)
  })
}
if (!watching) console.log('! 没有可监听的目录，仅静态服务')

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close()
    process.exit(0)
  })
}
