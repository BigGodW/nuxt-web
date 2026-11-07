/** GET /api/articles/:slug —— 文章详情（含上下篇） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo, notFound } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) notFound()

  const article = await withDemo(
    async () => {
      const row = await prisma.article.findFirst({
        where: { slug, status: 'PUBLISHED' },
        include: { category: true }
      })
      if (!row) return null
      await prisma.article
        .update({ where: { id: row.id }, data: { viewCount: { increment: 1 } } })
        .catch(() => {})
      const [prev, next] = await Promise.all([
        prisma.article.findFirst({
          where: { status: 'PUBLISHED', publishedAt: { gt: row.publishedAt || row.createdAt } },
          orderBy: { publishedAt: 'asc' }, select: { title: true, slug: true }
        }),
        prisma.article.findFirst({
          where: { status: 'PUBLISHED', publishedAt: { lt: row.publishedAt || row.createdAt } },
          orderBy: { publishedAt: 'desc' }, select: { title: true, slug: true }
        })
      ])
      return { ...row, prev, next }
    },
    () => {
      const index = demoStore.articles.findIndex((item) => item.slug === slug && item.status === 'PUBLISHED')
      if (index < 0) return null
      const list = demoStore.articles.filter((item) => item.status === 'PUBLISHED')
      return {
        ...list[index],
        prev: list[index - 1] ? { title: list[index - 1].title, slug: list[index - 1].slug } : null,
        next: list[index + 1] ? { title: list[index + 1].title, slug: list[index + 1].slug } : null
      }
    }
  )

  if (!article) notFound('文章不存在或已下线')
  return ok(article)
})
