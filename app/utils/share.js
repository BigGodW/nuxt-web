/**
 * 分享能力层（纯前端，零 UI 依赖）
 * ------------------------------------------------------------
 * 平台现实说明：
 * - 微信：网页无法直接调起「发送给朋友 / 分享到朋友圈」，需公众号 JS-SDK 签名。
 *   微信内引导右上角菜单；非微信环境提供二维码扫码打开 + 分享海报。
 * - 抖音：无网页分享 API（仅 App SDK），可行路径是保存海报 / 复制文案后发布，
 *   或在抖音内置浏览器引导右上角分享。
 * - Web Share API：手机系统原生分享面板，一次点击可流向微信、抖音等已安装 App，
 *   是 Web 端唯一真正意义上的「一键分享到任意 App」。
 */

/** 识别运行环境，用于决定每个平台按钮的行为 */
export function detectShareEnv() {
  if (typeof navigator === 'undefined') {
    return { wechat: false, douyin: false, weibo: false, qq: false, mobile: false, webShare: false, webShareFiles: false }
  }
  const ua = navigator.userAgent || ''
  return {
    wechat: /MicroMessenger/i.test(ua),
    douyin: /aweme|douyin|bytedancewebview/i.test(ua),
    weibo: /Weibo/i.test(ua),
    qq: /\bQQ\//i.test(ua) || /QQBrowser/i.test(ua),
    mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(ua),
    webShare: typeof navigator.share === 'function',
    webShareFiles: typeof navigator.canShare === 'function'
  }
}

/** 平台清单，供分享面板统一渲染（图标用中文方印，避免额外图片资源） */
export const SHARE_PLATFORMS = [
  { key: 'wechat', label: '微信', mark: '微', tone: 'jade' },
  { key: 'moments', label: '朋友圈', mark: '圈', tone: 'jade' },
  { key: 'douyin', label: '抖音', mark: '抖', tone: 'ink' },
  { key: 'weibo', label: '微博', mark: '博', tone: 'cinnabar' },
  { key: 'qq', label: 'QQ', mark: 'Q', tone: 'gold' },
  { key: 'qzone', label: 'QQ空间', mark: '空', tone: 'gold' },
  { key: 'copy', label: '复制链接', mark: '链', tone: 'ink' },
  { key: 'poster', label: '分享海报', mark: '图', tone: 'cinnabar' }
]

/** 规范化分享地址：优先使用配置的站点域名，去掉 hash 与跟踪参数 */
export function normalizeShareUrl(href, siteUrl = '') {
  if (!href) return ''
  try {
    const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (siteUrl) {
      const base = new URL(siteUrl)
      url.protocol = base.protocol
      url.host = base.host
    }
    url.hash = ''
    return url.toString()
  } catch {
    return href
  }
}

/** 第三方网页分享链接（微博 / QQ / QQ空间 有公开的网页分享入口） */
export function buildShareLink(platform, { url, title, summary = '', image = '', siteName = '云涧' }) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(`${title} · ${siteName}`)
  const d = encodeURIComponent(summary || title)
  const p = encodeURIComponent(image || '')
  const links = {
    weibo: `https://service.weibo.com/share/share.php?url=${u}&title=${t}&pic=${p}`,
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${u}&title=${t}&desc=${d}&pics=${p}&site=${encodeURIComponent(siteName)}`,
    qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${u}&title=${t}&desc=${d}&pics=${p}&summary=${d}`
  }
  return links[platform] || ''
}

/** 复制文本，兼容非 https / 旧浏览器的 execCommand 降级 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('复制失败')
}

/** 调起系统原生分享面板（可选择微信、抖音等任意已安装 App） */
export async function systemShare({ title, text, url, files = [] }) {
  if (typeof navigator.share !== 'function') throw new Error('当前浏览器不支持系统分享')
  const data = { title, text: text || title }
  if (files.length && navigator.canShare?.({ files })) {
    data.files = files
  } else if (url) {
    data.url = url
  }
  await navigator.share(data)
}

/**
 * 分享卡片图（og:image / 微信抓取）
 * 微信对 SVG / WebP 缩略图兼容较差，七牛图片统一输出 600w JPG；
 * 站内静态图与外链保持原样，仅补成绝对地址。
 */
export function toShareCardImage(resolvedUrl, { origin = '', cdnDomain = '' } = {}) {
  if (!resolvedUrl) return ''
  const url = /^https?:\/\//i.test(resolvedUrl) ? resolvedUrl : `${origin}${resolvedUrl}`
  const domain = String(cdnDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
  if (!domain || /[?&]imageView2/i.test(url)) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname.toLowerCase() === domain && /\.(jpe?g|png|webp|avif)$/i.test(parsed.pathname)) {
      const sep = url.includes('?') ? '&' : '?'
      return `${url}${sep}imageView2/2/w/600/format/jpg/q/85`
    }
  } catch {
    // 非标准 URL 直接返回
  }
  return url
}

/** 同源代理地址：让 Canvas 合成海报时不会被跨域图片污染 */
export function posterImageUrl(image, width = 690) {
  if (!image) return ''
  const absolute = /^https?:\/\//i.test(image) ? image : (/^\//.test(image) ? image : `/${image}`)
  return `/api/share/image?url=${encodeURIComponent(absolute)}&w=${width}`
}

export function posterQrUrl(url, size = 240) {
  return `/api/share/qr?url=${encodeURIComponent(url)}&size=${size}`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/** 按像素宽度折行，超出最大行数时末行补省略号 */
function wrapText(ctx, text, maxWidth, maxLines) {
  const chars = Array.from(String(text || ''))
  const lines = []
  let line = ''
  for (const char of chars) {
    if (char === '\n') {
      lines.push(line)
      line = ''
      continue
    }
    if (ctx.measureText(line + char).width > maxWidth && line) {
      lines.push(line)
      line = char
      if (lines.length >= maxLines) break
    } else {
      line += char
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  const clipped = lines.slice(0, maxLines)
  if (chars.length > clipped.join('').length) {
    let last = clipped[maxLines - 1] || ''
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    clipped[maxLines - 1] = `${last}…`
  }
  return clipped
}

/** 等比 cover 裁切绘制 */
function drawCover(ctx, img, x, y, w, h) {
  // 部分 SVG 没有固有尺寸，浏览器会返回 0，这里给默认画布尺寸兜底
  const iw = img.width || img.naturalWidth || 300
  const ih = img.height || img.naturalHeight || 200
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/**
 * 生成中国风分享海报（750×1180 PNG）
 * 所有图片均经 /api/share/* 同源代理，保证 canvas.toBlob 可用。
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number}>}
 */
export async function buildSharePoster({
  title = '',
  summary = '',
  price = '',
  image = '',
  url = '',
  siteName = '云涧',
  tag = ''
} = {}) {
  const W = 750
  const H = 1180
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器不支持 Canvas')

  // 宣纸底 + 极淡云纹光晕
  ctx.fillStyle = '#f7f3ea'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(120, 90, 10, 120, 90, 520)
  glow.addColorStop(0, 'rgba(185,148,86,0.14)')
  glow.addColorStop(1, 'rgba(185,148,86,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // 金色内框
  ctx.strokeStyle = '#ddd3bf'
  ctx.lineWidth = 2
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = 'rgba(185,148,86,0.55)'
  ctx.lineWidth = 1
  ctx.strokeRect(34, 34, W - 68, H - 68)

  // 品牌头
  ctx.fillStyle = '#a8322d'
  ctx.fillRect(60, 62, 44, 44)
  ctx.fillStyle = '#fffdf8'
  ctx.font = '28px "Songti SC", "SimSun", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('云', 82, 85)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#1f1d1a'
  ctx.font = '30px "Songti SC", "SimSun", serif'
  ctx.fillText(siteName, 120, 84)
  ctx.fillStyle = '#8a8175'
  ctx.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('YUN JIAN  ·  ORIENTAL LIVING', 120, 108)
  ctx.strokeStyle = '#ddd3bf'
  ctx.beginPath()
  ctx.moveTo(60, 132)
  ctx.lineTo(W - 60, 132)
  ctx.stroke()

  let cursor = 168

  // 封面图（失败则自动跳过，不影响海报导出）
  if (image) {
    try {
      const img = await loadImage(posterImageUrl(image, 690))
      drawCover(ctx, img, 60, cursor, 630, 400)
      ctx.strokeStyle = '#ddd3bf'
      ctx.lineWidth = 2
      ctx.strokeRect(60, cursor, 630, 400)
      cursor += 400 + 44
    } catch {
      cursor += 8
    }
  } else {
    cursor += 8
  }

  // 分类标签
  if (tag) {
    ctx.fillStyle = '#b99456'
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(tag.toUpperCase(), 60, cursor)
    cursor += 36
  }

  // 标题
  ctx.fillStyle = '#1f1d1a'
  ctx.font = 'bold 40px "Songti SC", "SimSun", serif'
  const titleLines = wrapText(ctx, title, 630, 3)
  for (const line of titleLines) {
    ctx.fillText(line, 60, cursor + 24)
    cursor += 58
  }
  cursor += 14

  // 摘要
  if (summary) {
    ctx.fillStyle = '#4a453d'
    ctx.font = '23px "PingFang SC", "Microsoft YaHei", sans-serif'
    for (const line of wrapText(ctx, summary, 630, 3)) {
      ctx.fillText(line, 60, cursor)
      cursor += 36
    }
  }

  // 商品价格
  if (price) {
    cursor += 12
    ctx.fillStyle = '#a8322d'
    ctx.font = 'bold 34px "Songti SC", "SimSun", serif'
    ctx.fillText(String(price), 60, cursor)
    cursor += 30
  }

  // 底部装饰线
  const lineY = 962
  ctx.strokeStyle = '#ddd3bf'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, lineY)
  ctx.lineTo(W - 60, lineY)
  ctx.stroke()
  ctx.fillStyle = '#b99456'
  ctx.font = '18px serif'
  ctx.textAlign = 'center'
  ctx.fillText('◆', W / 2, lineY)
  ctx.textAlign = 'left'

  // 二维码
  let qrDrawn = false
  if (url) {
    try {
      const qr = await loadImage(posterQrUrl(url, 240))
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(520, 992, 170, 170)
      ctx.drawImage(qr, 525, 997, 160, 160)
      qrDrawn = true
    } catch {
      qrDrawn = false
    }
  }

  ctx.fillStyle = '#1f1d1a'
  ctx.font = '25px "Songti SC", "SimSun", serif'
  ctx.fillText(qrDrawn ? '扫码细看 · 长按识别' : '云涧 · 东方器物', 60, 1030)
  ctx.fillStyle = '#8a8175'
  ctx.font = '19px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('一器一物，自有山河', 60, 1068)
  ctx.fillText(siteName, 60, 1100)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('海报生成失败'))), 'image/png')
  })
  const dataUrl = canvas.toDataURL('image/png')
  canvas.width = 0
  canvas.height = 0
  return { blob, dataUrl, width: W, height: H }
}

/** 下载 / 保存海报 */
export function savePoster(dataUrl, filename = '云涧分享海报.png') {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
