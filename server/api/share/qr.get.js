/** GET /api/share/qr?url=... —— 生成分享二维码（SVG） */
import QRCode from 'qrcode'

/**
 * 只允许生成本站链接的二维码，避免接口被滥用成任意网址的二维码服务。
 *
 * EdgeOne / Serverless 常把云函数内部域名作为 Host（如 pages-scf-*.qcloudteo.com），
 * 与用户实际访问的对外域名不一致，因此需同时采信代理转发头与请求来源。
 */
function toHost(value) {
  if (!value) return ''
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).host.toLowerCase()
  } catch {
    return ''
  }
}

function isSameSite(target, event) {
  let url
  try {
    url = new URL(target)
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false

  const config = useRuntimeConfig()
  const forwarded = getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'x-original-host') || ''
  const source = getRequestHeader(event, 'referer') || getRequestHeader(event, 'origin') || ''
  const hosts = new Set([
    toHost(config.public?.siteUrl),
    toHost(getRequestHost(event)),
    toHost(forwarded),
    toHost(source)
  ].filter(Boolean))

  if (hosts.has(url.host.toLowerCase())) return true
  // 未配置正式域名时，接受平台分配的预览域名（平台自有域，不会开放成任意网址二维码）
  if (!config.public?.siteUrl && /\.edgeone\.cool$/i.test(url.hostname)) return true
  return false
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const target = String(query.url || '')
  if (!target || target.length > 500 || !isSameSite(target, event)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持生成当前站点页面的分享二维码' })
  }

  const size = Math.min(400, Math.max(120, Number.parseInt(query.size, 10) || 240))
  const svg = await QRCode.toString(target, {
    type: 'svg',
    margin: 1,
    width: size,
    errorCorrectionLevel: 'M',
    color: { dark: '#1f1d1a', light: '#ffffff' }
  })

  setHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return svg
})
