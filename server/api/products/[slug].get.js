/** GET /api/products/:slug —— 商品详情（轮播图 / 规格 / 相关推荐） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo, notFound } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) notFound()

  const product = await withDemo(
    async () => {
      const row = await prisma.product.findFirst({
        where: { slug, status: 'ON_SALE' },
        include: {
          category: true,
          type: true,
          images: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] }
        }
      })
      if (!row) return null
      await prisma.product.update({ where: { id: row.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
      const related = await prisma.product.findMany({
        where: { status: 'ON_SALE', id: { not: row.id }, ...(row.categoryId ? { categoryId: row.categoryId } : {}) },
        take: 4, orderBy: { sortOrder: 'asc' },
        select: { name: true, slug: true, subtitle: true, coverImage: true, price: true }
      })
      return { ...row, related }
    },
    () => {
      const row = demoStore.products.find((item) => item.slug === slug && item.status === 'ON_SALE')
      if (!row) return null
      const related = demoStore.products
        .filter((item) => item.id !== row.id && item.categoryId === row.categoryId)
        .slice(0, 4)
        .map(({ name, slug: s, subtitle, coverImage, price }) => ({ name, slug: s, subtitle, coverImage, price }))
      return { ...row, related }
    }
  )

  if (!product) notFound('商品不存在或已下架')
  return ok(product)
})
