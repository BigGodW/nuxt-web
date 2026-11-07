/**
 * /api/admin/products/:id
 * GET / PUT / DELETE
 * 更新时整组替换图片（先删后建），保证轮播顺序与后台一致。
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, notFound, demoAware, badRequest } from '../../../utils/response.js'
import { makeSlug, normalizeSpecs, normalizeImages } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

const productInclude = { category: true, type: true, images: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] } }

function buildData(body) {
  const data = {}
  const strings = ['name', 'subtitle', 'summary', 'description', 'coverImage', 'unit', 'origin', 'material', 'craft', 'packageInfo', 'seoTitle', 'seoDescription']
  strings.forEach((key) => {
    if (body[key] !== undefined) data[key] = String(body[key] ?? '')
  })
  if (body.price !== undefined) data.price = Number(body.price) || 0
  if (body.originalPrice !== undefined) data.originalPrice = body.originalPrice ? Number(body.originalPrice) || null : null
  if (body.stock !== undefined) data.stock = Number.parseInt(body.stock, 10) || 0
  if (body.sortOrder !== undefined) data.sortOrder = Number.parseInt(body.sortOrder, 10) || 0
  const booleans = ['isFeatured', 'isRecommend']
  booleans.forEach((key) => { if (body[key] !== undefined) data[key] = Boolean(body[key]) })
  if (body.status !== undefined) data.status = body.status === 'OFF_SHELF' ? 'OFF_SHELF' : 'ON_SALE'
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null
  if (body.typeId !== undefined) data.typeId = body.typeId || null
  if (body.slug !== undefined) data.slug = makeSlug(body.slug, 'product')
  if (body.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map(String) : String(body.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  }
  if (body.specs !== undefined) data.specs = normalizeSpecs(body.specs)
  return data
}

function allImages(body) {
  return [
    ...normalizeImages(body.images, 'CAROUSEL'),
    ...normalizeImages(body.detailImages, 'DETAIL')
  ]
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) badRequest('缺少商品 ID')
  const method = getMethod(event)

  if (method === 'DELETE') {
    await demoAware(
      event,
      () => prisma.product.delete({ where: { id } }),
      () => { demoStore.products = demoStore.products.filter((item) => item.id !== id) }
    )
    return ok({ id })
  }

  if (method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))
    const data = buildData(body)
    const images = allImages(body)
    const product = await demoAware(
      event,
      async () => {
        // 交互式事务：回调里的 tx 是原生 Prisma Client，保留删图/改主表/重建图的原子性
        await prisma.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { productId: id } })
          await tx.product.update({ where: { id }, data })
          if (images.length) {
            await tx.productImage.createMany({ data: images.map((img) => ({ ...img, productId: id })) })
          }
        })
        return prisma.product.findUnique({ where: { id }, include: productInclude })
      },
      () => {
        const item = demoStore.products.find((row) => row.id === id)
        if (!item) throw createError({ statusCode: 404, statusMessage: '商品不存在' })
        Object.assign(item, data, { updatedAt: new Date().toISOString() })
        item.images = images.map((img, index) => ({ ...img, id: `pi-${id}-${index}`, productId: id }))
        item.category = demoStore.productCategories.find((c) => c.id === item.categoryId) || null
        item.type = demoStore.productTypes.find((t) => t.id === item.typeId) || null
        return item
      }
    )
    return ok(product)
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const product = await demoAware(
    event,
    () => prisma.product.findUnique({ where: { id }, include: productInclude }),
    () => demoStore.products.find((item) => item.id === id) || null
  )
  if (!product) notFound('商品不存在')
  return ok(product)
})
