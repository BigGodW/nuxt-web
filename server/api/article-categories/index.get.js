/** GET /api/article-categories —— 文章分类（含文章数） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async () => {
  const list = await withDemo(
    () => prisma.articleCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } }
    }).then((rows) => rows.map((row) => ({ ...row, count: row._count.articles }))),
    () => [...demoStore.articleCategories].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  return ok(list)
})
