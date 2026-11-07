/**
 * /api/admin/banners —— 站点轮播图
 * GET 列表 / POST 新增
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, demoAware } from '../../../utils/response.js'
import { normalizeBanner } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event).catch(() => ({}))
    const data = normalizeBanner(body, true)
    const row = await demoAware(
      event,
      () => prisma.banner.create({ data }),
      () => {
        const created = { id: `b-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        demoStore.banners.push(created)
        return created
      }
    )
    return ok(row)
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const query = getQuery(event)
  const position = String(query.position || '')
  const list = await demoAware(
    event,
    () => prisma.banner.findMany({
      where: position ? { position } : {},
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }]
    }),
    () => [...demoStore.banners]
      .filter((item) => !position || item.position === position)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  )
  return ok(list)
})
