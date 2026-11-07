/** GET /api/admin/stats —— 仪表盘统计 */
import { prisma } from '../../utils/prisma.js'
import { ok, demoAware } from '../../utils/response.js'
import { demoStore } from '../../utils/demo-data.js'

export default defineEventHandler(async (event) => {
  const data = await demoAware(
    event,
    async () => {
      const [articleCount, publishedCount, productCount, onSaleCount, bannerCount, categoryCount, recentArticles, recentProducts, views] = await Promise.all([
        prisma.article.count(),
        prisma.article.count({ where: { status: 'PUBLISHED' } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ON_SALE' } }),
        prisma.banner.count(),
        prisma.productCategory.count(),
        prisma.article.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, createdAt: true, viewCount: true } }),
        prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, status: true, price: true, createdAt: true } }),
        prisma.article.aggregate({ _sum: { viewCount: true } })
      ])
      return {
        counts: { articles: articleCount, published: publishedCount, products: productCount, onSale: onSaleCount, banners: bannerCount, categories: categoryCount },
        totalViews: views._sum.viewCount || 0,
        recentArticles, recentProducts
      }
    },
    () => ({
      counts: {
        articles: demoStore.articles.length,
        published: demoStore.articles.filter((a) => a.status === 'PUBLISHED').length,
        products: demoStore.products.length,
        onSale: demoStore.products.filter((p) => p.status === 'ON_SALE').length,
        banners: demoStore.banners.length,
        categories: demoStore.productCategories.length
      },
      totalViews: demoStore.articles.reduce((sum, a) => sum + (a.viewCount || 0), 0),
      recentArticles: demoStore.articles.slice(0, 5).map(({ id, title, status, createdAt, viewCount }) => ({ id, title, status, createdAt, viewCount })),
      recentProducts: demoStore.products.slice(0, 5).map(({ id, name, status, price, createdAt }) => ({ id, name, status, price, createdAt }))
    })
  )
  return ok(data)
})
