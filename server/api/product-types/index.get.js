/** GET /api/product-types —— 商品类型（工艺 / 系列维度） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async () => {
  const list = await withDemo(
    () => prisma.productType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { status: 'ON_SALE' } } } } }
    }).then((rows) => rows.map((row) => ({ ...row, count: row._count.products }))),
    () => [...demoStore.productTypes].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  return ok(list)
})
