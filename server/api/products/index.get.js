/** GET /api/products —— 商品列表（分页 / 品种 / 类型 / 搜索 / 精选） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo, pagination, paged } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip, take } = pagination(query)
  const category = String(query.category || '')
  const type = String(query.type || '')
  const keyword = String(query.keyword || '').trim()
  const featured = query.featured === 'true' || query.featured === '1'
  const recommend = query.recommend === 'true' || query.recommend === '1'
  const limit = Number.parseInt(query.limit, 10)
  const sort = String(query.sort || 'default')
  const orderBy = sort === 'featured'
    ? [{ isFeatured: 'desc' }, { sortOrder: 'asc' }]
    : sort === 'new'
      ? [{ createdAt: 'desc' }]
      : [{ sortOrder: 'asc' }, { createdAt: 'desc' }]

  const where = {
    status: 'ON_SALE',
    ...(category ? { category: { slug: category } } : {}),
    ...(type ? { type: { slug: type } } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(recommend ? { isRecommend: true } : {}),
    ...(keyword
      ? { OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { subtitle: { contains: keyword, mode: 'insensitive' } },
          { summary: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } }
        ] }
      : {})
  }

  const result = await withDemo(
    async () => {
      const [list, total] = await prisma.$transaction([
        prisma.product.findMany({
          where, include: { category: true, type: true },
          orderBy, skip, take
        }),
        prisma.product.count({ where })
      ])
      return paged(list, total, page, pageSize)
    },
    () => {
      let list = demoStore.products.filter((item) => item.status === 'ON_SALE')
      if (category) list = list.filter((item) => item.category?.slug === category)
      if (type) list = list.filter((item) => item.type?.slug === type)
      if (featured) list = list.filter((item) => item.isFeatured)
      if (recommend) list = list.filter((item) => item.isRecommend)
      if (keyword) {
        const key = keyword.toLowerCase()
        list = list.filter((item) =>
          [item.name, item.subtitle, item.summary].some((field) => String(field || '').toLowerCase().includes(key)) ||
          (item.tags || []).some((tag) => tag.toLowerCase().includes(key))
        )
      }
      if (sort === 'featured') list = [...list].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)
      else if (sort === 'new') list = [...list].reverse()
      else list = [...list].sort((a, b) => a.sortOrder - b.sortOrder)
      const size = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 60) : pageSize
      return paged(list.slice(skip, skip + size), list.length, page, size)
    }
  )

  return ok(result)
})
