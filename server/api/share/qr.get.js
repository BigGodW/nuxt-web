/** GET /api/share/qr?url=... —— 生成分享二维码（SVG） */
import QRCode from 'qrcode'

/**
 * 只允许生成本站链接的二维码，避免接口被滥用成任意网址的二维码服务。
 * 比对当前请求 host 与 runtimeConfig.public.siteUrl 的 host。
 */
function isSameSite(target, event) {
  let url
  try {
    url = new URL(target)
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false
  const config = useRuntimeConfig()
  const requestHost = getRequestHost(event)
  const candidates = [
    config.public?.siteUrl || '',
    `https://${requestHost}`,
    `http://${requestHost}`
  ]
  return candidates.some((item) => {
    try {
      return new URL(item).host === url.host
    } catch {
      return false
    }
  })
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
