/** GET /api/articles —— 文章列表（分页 / 分类 / 搜索） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo, pagination, paged } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export const articleInclude = { category: true }

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip, take } = pagination(query)
  const category = String(query.category || '')
  const keyword = String(query.keyword || '').trim()

  const where = {
    status: 'PUBLISHED',
    ...(category ? { category: { slug: category } } : {}),
    ...(keyword
      ? { OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { summary: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } }
        ] }
      : {})
  }

  const result = await withDemo(
    async () => {
      const [list, total] = await prisma.$transaction([
        prisma.article.findMany({
          where, include: articleInclude,
          orderBy: [{ isTop: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
          skip, take
        }),
        prisma.article.count({ where })
      ])
      return paged(list, total, page, pageSize)
    },
    () => {
      let list = demoStore.articles.filter((item) => item.status === 'PUBLISHED')
      if (category) list = list.filter((item) => item.category?.slug === category)
      if (keyword) {
        const key = keyword.toLowerCase()
        list = list.filter((item) =>
          item.title.toLowerCase().includes(key) ||
          String(item.summary || '').toLowerCase().includes(key) ||
          (item.tags || []).some((tag) => tag.toLowerCase().includes(key))
        )
      }
      list = [...list].sort((a, b) => Number(b.isTop) - Number(a.isTop))
      return paged(list.slice(skip, skip + take), list.length, page, pageSize)
    }
  )

  return ok(result)
})
