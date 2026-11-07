/** GET /api/site/banners?position=HOME —— 站点轮播图 */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const position = String(getQuery(event).position || 'HOME')
  const banners = await withDemo(
    () => prisma.banner.findMany({
      where: { position, status: 'ENABLED' },
      orderBy: { sortOrder: 'asc' }
    }),
    () => demoStore.banners
      .filter((item) => item.position === position && item.status === 'ENABLED')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  )
  return ok(banners)
})
