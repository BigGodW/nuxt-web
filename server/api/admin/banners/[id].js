/**
 * /api/admin/banners/:id —— PUT 修改 / DELETE 删除
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, demoAware, badRequest } from '../../../utils/response.js'
import { normalizeBanner } from '../../../utils/normalize.js'
import { demoStore } from '../../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) badRequest('缺少轮播 ID')
  const method = getMethod(event)

  if (method === 'DELETE') {
    await demoAware(
      event,
      () => prisma.banner.delete({ where: { id } }),
      () => { demoStore.banners = demoStore.banners.filter((item) => item.id !== id) }
    )
    return ok({ id })
  }

  if (method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))
    const data = normalizeBanner(body)
    const row = await demoAware(
      event,
      () => prisma.banner.update({ where: { id }, data }),
      () => {
        const item = demoStore.banners.find((entry) => entry.id === id)
        if (!item) throw createError({ statusCode: 404, statusMessage: '轮播图不存在' })
        Object.assign(item, data)
        return item
      }
    )
    return ok(row)
  }

  throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })
})
