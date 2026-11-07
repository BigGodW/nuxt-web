/** URL 友好的 slug：英文数字保留，中文/空值使用短随机后缀 */
export function makeSlug(input, fallbackPrefix = 'item') {
  const ascii = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (ascii) return ascii
  return `${fallbackPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** 规范化规格参数：接受数组或 JSON 字符串 */
export function normalizeSpecs(value) {
  if (!value) return []
  let list = value
  if (typeof value === 'string') {
    try { list = JSON.parse(value) } catch { return [] }
  }
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => item && (item.name || item.value))
    .map((item) => ({ name: String(item.name || ''), value: String(item.value || '') }))
}

/** 规范化轮播图字段 */
export function normalizeBanner(body = {}, isCreate = false) {
  const data = {}
  ;['title', 'subtitle', 'image', 'link', 'position'].forEach((key) => {
    if (body[key] !== undefined) data[key] = String(body[key] ?? '')
  })
  if (body.sortOrder !== undefined) data.sortOrder = Number.parseInt(body.sortOrder, 10) || 0
  if (body.status !== undefined) data.status = body.status === 'DISABLED' ? 'DISABLED' : 'ENABLED'
  if (isCreate) {
    if (!String(body.title || '').trim()) throw createError({ statusCode: 400, statusMessage: '请填写轮播标题' })
    if (!String(body.image || '').trim()) throw createError({ statusCode: 400, statusMessage: '请上传轮播图片' })
    data.title = String(body.title).trim()
    data.image = String(body.image).trim()
    if (!data.position) data.position = 'HOME'
    if (!data.status) data.status = 'ENABLED'
    if (data.sortOrder === undefined) data.sortOrder = 0
  }
  return data
}

/** 规范化图片列表 */
export function normalizeImages(value, kind = 'CAROUSEL') {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && (typeof item === 'string' ? item.trim() : item.url))
    .map((item, index) => ({
      url: String(typeof item === 'string' ? item : item.url).trim(),
      alt: String((typeof item === 'object' && item.alt) || '').slice(0, 120),
      kind: (typeof item === 'object' && item.kind) || kind,
      sortOrder: (typeof item === 'object' && Number(item.sortOrder)) || index
    }))
}
