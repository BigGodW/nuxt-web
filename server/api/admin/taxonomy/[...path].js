/**
 * /api/admin/taxonomy/... —— 分类类目统一 REST
 * ------------------------------------------------------------
 * GET    /api/admin/taxonomy/article-categories      文章分类列表
 * POST   /api/admin/taxonomy/article-categories      新增
 * PUT    /api/admin/taxonomy/product-categories/:id  修改
 * DELETE /api/admin/taxonomy/product-types/:id       删除
 * 通过资源白名单映射 Prisma 模型，避免任意模型访问；新增维度只需扩展 RESOURCES。
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, demoAware, badRequest } from '../../../utils/response.js'
import { makeSlug } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

const RESOURCES = {
  'article-categories': {
    model: 'articleCategory', store: 'articleCategories', label: '文章分类',
    fields: ['name', 'slug', 'description', 'sortOrder']
  },
  'product-categories': {
    model: 'productCategory', store: 'productCategories', label: '商品品种',
    fields: ['name', 'slug', 'description', 'image', 'parentId', 'sortOrder']
  },
  'product-types': {
    model: 'productType', store: 'productTypes', label: '商品类型',
    fields: ['name', 'slug', 'description', 'sortOrder']
  }
}

function pickData(body, fields, isCreate) {
  const data = {}
  fields.forEach((field) => {
    if (body[field] === undefined) return
    if (field === 'sortOrder') data[field] = Number.parseInt(body[field], 10) || 0
    else if (field === 'parentId') data[field] = body[field] || null
    else if (field === 'slug') data[field] = makeSlug(body[field], 'category')
    else data[field] = String(body[field] ?? '')
  })
  if (isCreate) {
    const name = String(body.name || '').trim()
    if (!name) badRequest('请填写名称')
    data.name = name
    if (!data.slug) data.slug = makeSlug(name, 'category')
    if (data.sortOrder === undefined) data.sortOrder = 0
  }
  return data
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'path') || ''
  const [resource, id] = raw.split('/').filter(Boolean)
  const conf = RESOURCES[resource]
  if (!conf) throw createError({ statusCode: 404, statusMessage: '未知分类资源' })

  const method = getMethod(event)
  const model = prisma[conf.model]

  if (method === 'GET') {
    if (id) {
      const row = await demoAware(
        event,
        () => model.findUnique({ where: { id } }),
        () => demoStore[conf.store].find((item) => item.id === id) || null
      )
      if (!row) throw createError({ statusCode: 404, statusMessage: `${conf.label}不存在` })
      return ok(row)
    }
    const list = await demoAware(
      event,
      () => model.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
      () => [...demoStore[conf.store]].sort((a, b) => a.sortOrder - b.sortOrder)
    )
    return ok(list)
  }

  if (method === 'POST') {
    const body = await readBody(event).catch(() => ({}))
    const data = pickData(body, conf.fields, true)
    const row = await demoAware(
      event,
      () => model.create({ data }),
      () => {
        const created = {
          id: `${resource}-${Date.now()}`, ...data,
          image: data.image || null, parentId: data.parentId || null,
          count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }
        demoStore[conf.store].push(created)
        return created
      }
    )
    return ok(row)
  }

  if (!id) badRequest('缺少资源 ID')

  if (method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))
    const data = pickData(body, conf.fields, false)
    const row = await demoAware(
      event,
      () => model.update({ where: { id }, data }),
      () => {
        const item = demoStore[conf.store].find((entry) => entry.id === id)
        if (!item) throw createError({ statusCode: 404, statusMessage: `${conf.label}不存在` })
        Object.assign(item, data)
        return item
      }
    )
    return ok(row)
  }

  if (method === 'DELETE') {
    await demoAware(
      event,
      () => model.delete({ where: { id } }),
      () => { demoStore[conf.store] = demoStore[conf.store].filter((item) => item.id !== id) }
    )
    return ok({ id })
  }

  throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })
})
