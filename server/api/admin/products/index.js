/**
 * /api/admin/products
 * GET  —— 后台商品列表
 * POST —— 新建商品（含轮播图、详情图、规格、品种、类型）
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, pagination, paged, demoAware, badRequest } from '../../../utils/response.js'
import { makeSlug, normalizeSpecs, normalizeImages } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

export const productInclude = { category: true, type: true, images: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] } }

function buildData(body, isCreate = false) {
  const name = String(body?.name || '').trim()
  if (!name) badRequest('请填写商品名称')
  const tags = Array.isArray(body.tags)
    ? body.tags.map(String)
    : String(body.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  const data = {
    name,
    subtitle: String(body.subtitle || ''),
    summary: String(body.summary || ''),
    description: String(body.description || ''),
    coverImage: String(body.coverImage || ''),
    price: Number(body.price) || 0,
    originalPrice: body.originalPrice ? Number(body.originalPrice) || null : null,
    stock: Number.parseInt(body.stock, 10) || 0,
    unit: String(body.unit || '件'),
    status: body.status === 'OFF_SHELF' ? 'OFF_SHELF' : 'ON_SALE',
    isFeatured: Boolean(body.isFeatured),
    isRecommend: Boolean(body.isRecommend),
    sortOrder: Number.parseInt(body.sortOrder, 10) || 0,
    origin: String(body.origin || ''),
    material: String(body.material || ''),
    craft: String(body.craft || ''),
    packageInfo: String(body.packageInfo || ''),
    specs: normalizeSpecs(body.specs),
    tags,
    seoTitle: String(body.seoTitle || ''),
    seoDescription: String(body.seoDescription || ''),
    categoryId: body.categoryId || null,
    typeId: body.typeId || null
  }
  if (isCreate || body.slug) data.slug = makeSlug(body.slug || name, 'product')
  return data
}

function allImages(body) {
  return [
    ...normalizeImages(body.images, 'CAROUSEL'),
    ...normalizeImages(body.detailImages, 'DETAIL')
  ]
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event).catch(() => ({}))
    const data = buildData(body, true)
    const images = allImages(body)
    const product = await demoAware(
      event,
      () => prisma.product.create({
        data: { ...data, images: images.length ? { create: images } : undefined },
        include: productInclude
      }),
      () => {
        const id = `p-${Date.now()}`
        const row = {
          id, ...data,
          viewCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          category: demoStore.productCategories.find((c) => c.id === data.categoryId) || null,
          type: demoStore.productTypes.find((t) => t.id === data.typeId) || null,
          images: images.map((img, index) => ({ ...img, id: `pi-${id}-${index}`, productId: id }))
        }
        demoStore.products.unshift(row)
        return row
      }
    )
    return ok(product)
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const query = getQuery(event)
  const { page, pageSize, skip, take } = pagination(query, 10)
  const keyword = String(query.keyword || '').trim()
  const status = String(query.status || '')
  const categoryId = String(query.categoryId || '')
  const where = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(keyword ? { OR: [{ name: { contains: keyword, mode: 'insensitive' } }, { subtitle: { contains: keyword, mode: 'insensitive' } }] } : {})
  }

  const result = await demoAware(
    event,
    async () => {
      const [list, total] = await Promise.all([
        prisma.product.findMany({
          where, include: productInclude,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], skip, take
        }),
        prisma.product.count({ where })
      ])
      return paged(list, total, page, pageSize)
    },
    () => {
      let list = [...demoStore.products]
      if (status) list = list.filter((item) => item.status === status)
      if (categoryId) list = list.filter((item) => item.categoryId === categoryId)
      if (keyword) list = list.filter((item) => item.name.includes(keyword) || String(item.subtitle || '').includes(keyword))
      return paged(list.slice(skip, skip + take), list.length, page, pageSize)
    }
  )
  return ok(result)
})
