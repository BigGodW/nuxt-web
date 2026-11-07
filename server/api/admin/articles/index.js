/**
 * /api/admin/articles
 * GET  —— 后台文章列表（含草稿、分页、搜索、状态筛选）
 * POST —— 新建文章
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, withDemo, pagination, paged, demoAware, badRequest } from '../../../utils/response.js'
import { makeSlug } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

function buildData(body, isCreate = false) {
  const title = String(body?.title || '').trim()
  if (!title) badRequest('请填写文章标题')
  const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  const tags = Array.isArray(body.tags)
    ? body.tags.map(String)
    : String(body.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  const data = {
    title,
    summary: String(body.summary || '').slice(0, 500),
    content: String(body.content || ''),
    coverImage: String(body.coverImage || ''),
    author: String(body.author || '云涧编辑部'),
    tags,
    status,
    isTop: Boolean(body.isTop),
    categoryId: body.categoryId || null,
    seoTitle: String(body.seoTitle || ''),
    seoDescription: String(body.seoDescription || ''),
    publishedAt: status === 'PUBLISHED' ? (body.publishedAt ? new Date(body.publishedAt) : new Date()) : null
  }
  if (isCreate || body.slug) data.slug = makeSlug(body.slug || title, 'article')
  return data
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event).catch(() => ({}))
    const data = buildData(body, true)
    const article = await demoAware(
      event,
      () => prisma.article.create({ data, include: { category: true } }),
      () => {
        const row = {
          id: `a-${Date.now()}`, ...data,
          viewCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          category: demoStore.articleCategories.find((item) => item.id === data.categoryId) || null
        }
        demoStore.articles.unshift(row)
        return row
      }
    )
    return ok(article)
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const query = getQuery(event)
  const { page, pageSize, skip, take } = pagination(query, 10)
  const keyword = String(query.keyword || '').trim()
  const status = String(query.status || '')
  const where = {
    ...(status ? { status } : {}),
    ...(keyword
      ? { OR: [{ title: { contains: keyword, mode: 'insensitive' } }, { summary: { contains: keyword, mode: 'insensitive' } }] }
      : {})
  }

  const result = await demoAware(
    event,
    async () => {
      const [list, total] = await prisma.$transaction([
        prisma.article.findMany({
          where, include: { category: true },
          orderBy: [{ isTop: 'desc' }, { createdAt: 'desc' }], skip, take
        }),
        prisma.article.count({ where })
      ])
      return paged(list, total, page, pageSize)
    },
    () => {
      let list = [...demoStore.articles]
      if (status) list = list.filter((item) => item.status === status)
      if (keyword) list = list.filter((item) => item.title.includes(keyword) || String(item.summary || '').includes(keyword))
      return paged(list.slice(skip, skip + take), list.length, page, pageSize)
    }
  )
  return ok(result)
})
