/** GET /api/site/settings —— 网站信息（对外，键值对象） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

function toMap(rows) {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export default defineEventHandler(async () => {
  const settings = await withDemo(
    () => prisma.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }] }).then(toMap),
    () => toMap(demoStore.settings)
  )
  return ok(settings)
})
