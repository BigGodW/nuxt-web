/**
 * Prisma 客户端（懒加载代理）
 *
 * 背景：EdgeOne Pages 的 SSR 云函数运行在精简 Node 镜像里，Prisma 原生
 * 查询引擎可能「加载即崩溃」，导致整个站点不可用。因此模块加载阶段
 * 绝不 import('@prisma/client')，只在首次真实查询时动态加载并复用单例。
 *
 * 对外保持 `prisma.article.findMany()` 写法不变。
 * 限制：代理返回的是普通 Promise，不是原生 PrismaPromise，因此
 * `$transaction([a, b])` 数组形式会报 "All elements need to be Prisma Client promises"。
 * 约定：只读并发用 Promise.all([...])，需要原子性的写操作用
 * `$transaction(async (tx) => ...)`（回调里的 tx 是原生 client）。
 * 连接串解析与错误分类统一放在 db-diagnose.js 中，便于线上自诊断。
 */
import { resolveDatabaseUrl, databaseUnavailable } from './db-diagnose.js'

const globalForPrisma = globalThis

async function getClient() {
  const { url } = resolveDatabaseUrl()
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

/**
 * 标记 rejection 已被观察。
 * prisma.$transaction([a, b]) 会先构造 a、b 两个 Promise；若数据库不可用，
 * 这两个分支的 rejection 无人接收会触发 unhandledRejection，
 * 云函数直接返回 500 而不是应用层的 503。加一个空 catch 即可避免。
 */
function observed(promise) {
  promise.catch(() => {})
  return promise
}

/** 保持 `prisma.<model>.<method>(...)` 的调用形态 */
function createModelProxy(model) {
  return new Proxy({}, {
    get(_target, method) {
      // 防止被误判为 thenable
      if (typeof method !== 'string' || method === 'then') return undefined
      return (...args) =>
        observed(getClient().then((client) => client[model][method](...args)))
    }
  })
}

export const prisma = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string' || prop === 'then') return undefined
    if (prop.startsWith('$')) {
      return (...args) =>
        observed(getClient().then((client) => client[prop](...args)))
    }
    return createModelProxy(prop)
  }
})
