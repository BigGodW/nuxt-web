/**
 * /api/admin/settings —— 网站信息
 * GET 全部配置项（按 group/sortOrder）
 * PUT 批量保存：{ items: [{ key, value, ... }] } 或 { key, value }
 */
import { prisma } from '../../../utils/prisma.js'
import { ok, demoAware, badRequest } from '../../../utils/response.js'
import { demoStore } from '../../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))
    const items = Array.isArray(body.items)
      ? body.items
      : (body.key ? [{ key: body.key, value: body.value }] : [])
    if (!items.length) badRequest('没有需要保存的配置')

    const saved = await demoAware(
      event,
      async () => {
        const rows = await Promise.all(
          items
            .filter((item) => item && item.key)
            .map((item) => prisma.siteSetting.upsert({
              where: { key: String(item.key) },
              update: { value: String(item.value ?? '') },
              create: {
                key: String(item.key),
                label: String(item.label || item.key),
                value: String(item.value ?? ''),
                group: String(item.group || 'basic'),
                type: String(item.type || 'text'),
                sortOrder: Number.parseInt(item.sortOrder, 10) || 0
              }
            }))
        )
        return rows.length
      },
      () => {
        items.filter((item) => item && item.key).forEach((item) => {
          const row = demoStore.settings.find((entry) => entry.key === item.key)
          if (row) row.value = String(item.value ?? '')
          else demoStore.settings.push({ key: String(item.key), label: String(item.label || item.key), value: String(item.value ?? ''), group: 'basic', type: 'text', sortOrder: 99 })
        })
        return items.length
      }
    )
    return ok({ saved })
  }

  if (method !== 'GET') throw createError({ statusCode: 405, statusMessage: '不支持的请求方法' })

  const list = await demoAware(
    event,
    () => prisma.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }] }),
    () => [...demoStore.settings].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  return ok(list)
})
