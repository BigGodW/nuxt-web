/** GET /api/product-categories —— 商品品种（二级树 + 商品数） */
import { prisma } from '../../utils/prisma.js'
import { ok, withDemo } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

function buildTree(rows) {
  const parents = rows.filter((row) => !row.parentId).map((row) => ({ ...row, children: [] }))
  parents.forEach((parent) => {
    parent.children = rows.filter((row) => row.parentId === parent.id)
  })
  return parents
}

export default defineEventHandler(async () => {
  const list = await withDemo(
    () => prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { status: 'ON_SALE' } } } } }
    }).then((rows) => buildTree(rows.map((row) => ({ ...row, count: row._count.products })))),
    () => buildTree([...demoStore.productCategories].sort((a, b) => a.sortOrder - b.sortOrder))
  )
  return ok(list)
})
