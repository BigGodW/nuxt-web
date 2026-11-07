/**
 * GET /api/share/image?url=...&w=600
 * ------------------------------------------------------------
 * 分享海报用 Canvas 合成图片，跨域图片会导致画布被污染、无法导出 PNG。
 * 这里把图片转为同源响应，并顺带让七牛按目标宽度实时转码，海报体积更小。
 * 严格域名白名单，防止 SSRF。
 */
const MAX_BYTES = 5 * 1024 * 1024

function allowedHosts(event) {
  const config = useRuntimeConfig()
  const clean = (value) => String(value || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
  return new Set([
    clean(config.qiniu?.cdnDomain || config.public?.qiniuCdnDomain),
    clean(getRequestHost(event))
  ].filter(Boolean))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const raw = String(query.url || '')
  const width = Math.min(1200, Math.max(120, Number.parseInt(query.w, 10) || 600))

  // 站内静态图：直接重定向到同源资源即可，无需服务端抓取
  if (/^\/[\w\-./]+\.(svg|png|jpe?g|webp|avif)$/i.test(raw) && !raw.includes('..')) {
    return sendRedirect(event, raw, 302)
  }

  let target
  try {
    target = new URL(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: '图片地址无效' })
  }
  if (!['http:', 'https:'].includes(target.protocol) || !allowedHosts(event).has(target.hostname.toLowerCase())) {
    throw createError({ statusCode: 400, statusMessage: '图片来源不在允许范围内' })
  }

  // 七牛 CDN 图片按海报所需宽度实时转码，避免拉取原图浪费带宽
  const config = useRuntimeConfig()
  const cdnDomain = String(config.qiniu?.cdnDomain || config.public?.qiniuCdnDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  let fetchUrl = target.toString()
  if (target.hostname.toLowerCase() === cdnDomain.toLowerCase() && !/[?&]imageView2/.test(fetchUrl)) {
    const sep = fetchUrl.includes('?') ? '&' : '?'
    fetchUrl += `${sep}imageView2/2/w/${width}/format/webp/q/82`
  }

  const response = await $fetch.raw(fetchUrl, {
    responseType: 'arrayBuffer',
    timeout: 8000,
    retry: 0
  }).catch(() => null)
  if (!response) throw createError({ statusCode: 502, statusMessage: '图片获取失败' })

  const buffer = Buffer.from(response._data || Buffer.alloc(0))
  if (!buffer.length || buffer.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: '图片体积超出限制' })
  }

  setHeader(event, 'Content-Type', response.headers.get('content-type') || 'image/webp')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return buffer
})
