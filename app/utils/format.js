/** ¥ 价格格式化 */
export function formatPrice(value) {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return '¥0.00'
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** 日期格式化：2026年11月07日 */
export function formatDate(value, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const base = `${y}年${m}月${d}日`
  if (!withTime) return base
  return `${base} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function truncate(value = '', max = 60) {
  const str = String(value)
  return str.length > max ? `${str.slice(0, max)}…` : str
}

/**
 * 图片地址解析
 * - 完整 http(s) / 站内 / 或 / 开头：原样返回
 * - 七牛 key：拼接 CDN 域名（runtimeConfig.public.qiniuCdnDomain）
 * - 未配置域名时返回 key 本身（组件会走占位图）
 */
export function imageUrl(path, fallback = '') {
  if (!path) return fallback
  if (/^(https?:\/\/|data:|\/)/.test(path)) return path
  const runtime = useRuntimeConfig()
  const domain = (runtime.public?.qiniuCdnDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  return domain ? `https://${domain}/${path}` : fallback
}

/* ==================== 七牛 CDN 实时图片处理 ====================
 * 数据库始终存「原图 URL」，仅在渲染时按屏幕宽度追加 imageView2 参数。
 * 好处：历史图片无需迁移、随时可调输出质量、原图永久保留可再出高清版。
 * 实测：469KB JPEG → 800w WebP 115KB（-75%）/ 400w 34KB（-93%）。
 * ================================================================ */

const DEFAULT_WIDTHS = [320, 480, 640, 800, 1200, 1600]

function imageCdnConfig() {
  const pub = useRuntimeConfig().public || {}
  const image = pub.image || {}
  // 环境变量覆盖后会变成 "320,480,..." 字符串，统一解析为数字数组
  const raw = image.srcsetWidths
  const parsed = Array.isArray(raw)
    ? raw
    : String(raw || '').split(',').map((n) => Number(n.trim())).filter((n) => n > 0)
  const widths = parsed.length ? parsed : DEFAULT_WIDTHS
  return {
    domain: String(pub.qiniuCdnDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase(),
    quality: Number(image.cdnQuality) || 82,
    widths
  }
}

/** 只有来自自有七牛 CDN 的位图才适合实时转码；外链与站内 SVG 原样返回 */
export function isQiniuImage(path) {
  const url = imageUrl(path)
  if (!/^https?:\/\//i.test(url)) return false
  const { domain } = imageCdnConfig()
  if (!domain) return false
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.hostname.toLowerCase() !== domain) return false
  if (/\.(svg|gif|apng|ico)$/i.test(parsed.pathname)) return false
  // 已带处理参数的地址直接返回，避免参数叠加导致 400
  if (/[?&](imageView2|imageMogr2)/i.test(url)) return false
  return true
}

/** 生成指定目标宽度的 WebP 图片地址（模式 2：等比缩放且不会放大原图） */
export function qiniuImage(path, width = 800, quality = 0) {
  const url = imageUrl(path)
  if (!url || !isQiniuImage(url)) return url
  const w = Math.max(1, Math.round(Number(width) || 800))
  const q = Number(quality) || imageCdnConfig().quality
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}imageView2/2/w/${w}/format/webp/q/${q}`
}

/** 生成响应式 srcset，浏览器按 DPR × sizes 自动挑选最合适的档位 */
export function qiniuSrcset(path, widths = null) {
  const url = imageUrl(path)
  if (!url || !isQiniuImage(url)) return ''
  const list = Array.isArray(widths) && widths.length ? widths : imageCdnConfig().widths
  return list.map((w) => `${qiniuImage(url, w)} ${w}w`).join(', ')
}

/** 状态文案映射 */
export const STATUS_TEXT = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ON_SALE: '在售',
  OFF_SHELF: '已下架',
  ENABLED: '启用',
  DISABLED: '停用'
}
