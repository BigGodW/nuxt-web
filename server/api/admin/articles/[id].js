/**
 * /api/admin/articles/:id
 * GET / PUT / DELETE
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, notFound, demoAware, badRequest } from '../../../utils/response.js'
import { makeSlug } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

function buildData(body) {
  const data = {}
  const strings = ['title', 'summary', 'content', 'coverImage', 'author', 'seoTitle', 'seoDescription']
  strings.forEach((key) => {
    if (body[key] !== undefined) data[key] = String(body[key] ?? '')
  })
  if (body.slug !== undefined) data.slug = makeSlug(body.slug, 'article')
  if (body.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map(String) : String(body.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  }
  if (body.isTop !== undefined) data.isTop = Boolean(body.isTop)
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null
  if (body.status !== undefined) {
    data.status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
    data.publishedAt = data.status === 'PUBLISHED' ? (body.publishedAt ? new Date(body.publishedAt) : new Date()) : null
  }
  return data
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) badRequest('缺少文章 ID')
  const method = getMethod(event)

  if (method === 'DELETE') {
    await demoAware(
      event,
      () => prisma.article.delete({ where: { id } }),
      () => { demoStore.articles = demoStore.articles.filter((item) => item.id !== id) }
    )
    return ok({ id })
  }

  if (method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))
    const data = buildData(body)
    const article = await demoAware(
      event,
      () => prisma.article.update({ where: { id }, data, include: { category: true } }),
      () => {
        const item = demoStore.articles.find((row) => row.id === id)
        if (!item) throw createError({ statusCode: 404, statusMessage: '文章不存在' })
        Object.assign(item, data, { updatedAt: new Date().toISOString() })
        item.category = demoStore.articleCategories.find((c) => c.id === item.categoryId) || null
        return item
      }
    )
    return ok(article)
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const article = await demoAware(
    event,
    () => prisma.article.findUnique({ where: { id }, include: { category: true } }),
    () => demoStore.articles.find((item) => item.id === id) || null
  )
  if (!article) notFound('文章不存在')
  return ok(article)
})
