/**
 * Prisma 客户端（懒加载代理）
 *
 * 背景：EdgeOne Pages 的 SSR 云函数固定运行在 Node 20.x，Prisma 的原生查询
 * 引擎在部分运行时镜像里「加载即崩溃」，平台会直接返回
 * INTERNAL_CLOUD_FUNCTION_ERROR，导致整个站点不可用。
 *
 * 策略：
 * 1. 模块加载阶段绝不 import('@prisma/client')，避免任何原生代码被执行；
 * 2. 未注入 DATABASE_URL 的预览/演示部署，查询抛「数据库不可用」，
 *    由 server/utils/response.js 的 withDemo() 统一回退到内置演示数据；
 * 3. 正式部署配置 DATABASE_URL 后，才在首次查询时动态加载 Prisma 并复用单例。
 *
 * 对外保持 `prisma.article.findMany()` / `prisma.$transaction()` 写法不变。
 */

const globalForPrisma = globalThis

/**
 * 解析数据库连接串
 * 1. 优先进程环境变量（npm run start 已通过 --env-file-if-exists 加载 .env）
 * 2. 回退 runtimeConfig.databaseUrl：兼容未注入环境变量的部署方式，
 *    也可用 NUXT_DATABASE_URL 覆盖
 */
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    return useRuntimeConfig().databaseUrl || ''
  } catch {
    return ''
  }
}

/** 构造成 withDemo() 能识别的「数据库不可用」错误 */
function databaseUnavailable() {
  const error = new Error('DATABASE_URL is not configured')
  error.name = 'PrismaClientInitializationError'
  return error
}

async function getClient() {
  const url = resolveDatabaseUrl()
  if (!url) throw databaseUnavailable()

  if (!globalForPrisma.__yunjianPrismaPromise) {
    globalForPrisma.__yunjianPrismaPromise = import('@prisma/client')
      .then((mod) => {
        // Node 20 无法对 CJS 包做 ESM 命名导入，统一走默认导出再解构
        const { PrismaClient } = mod.default || mod
        return new PrismaClient({
          log: ['warn', 'error'],
          // 显式传入，避免精简运行时里 env("DATABASE_URL") 解析失败
          datasources: { db: { url } }
        })
      })
      .catch((error) => {
        globalForPrisma.__yunjianPrismaPromise = null
        throw error
      })
  }
  return globalForPrisma.__yunjianPrismaPromise
}

/** 保持 `prisma.<model>.<method>(...)` 的调用形态 */
function createModelProxy(model) {
  return new Proxy({}, {
    get(_target, method) {
      // 防止被误判为 thenable
      if (typeof method !== 'string' || method === 'then') return undefined
      return (...args) => getClient().then((client) => client[model][method](...args))
    }
  })
}

export const prisma = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string' || prop === 'then') return undefined
    if (prop.startsWith('$')) {
      return (...args) => getClient().then((client) => client[prop](...args))
    }
    return createModelProxy(prop)
  }
})
