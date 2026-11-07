/**
 * 统一响应与错误处理
 * 所有接口返回 { code, message, data, meta? }
 */

export function ok(data, meta) {
  return meta ? { code: 0, message: 'ok', data, meta } : { code: 0, message: 'ok', data }
}

export function badRequest(message = '参数有误') {
  throw createError({ statusCode: 400, statusMessage: message })
}

export function notFound(message = '内容不存在') {
  throw createError({ statusCode: 404, statusMessage: message })
}

/** 是否为「数据库不可用 / 未迁移」类错误 */
export function isDatabaseUnavailable(error) {
  if (!error) return false
  const name = String(error.name || '')
  const code = String(error.code || '')
  const message = String(error.message || '')
  return (
    name.includes('PrismaClientInitializationError') ||
    name.includes('PrismaClientKnownRequestError') && /P20\d\d|P10\d\d/.test(code) ||
    /^P1\d{3}$/.test(code) ||
    /^P20\d{2}$/.test(code) ||
    /can't reach database|does not exist|ECONNREFUSED|ENOTFOUND|authentication failed|environment variable not found|relation .* does not exist|no such table/i.test(message)
  )
}

/** 演示模式开关（.env: NUXT_DEMO_MODE / DEMO_MODE） */
export function isDemoMode() {
  const config = useRuntimeConfig()
  return config.demoMode === true || config.demoMode === 'true'
}

/**
 * 数据库查询包装：连接失败时回退演示数据
 * 便于「克隆项目 → npm install → npm run dev」立即看到完整界面。
 * 生产环境把 NUXT_DEMO_MODE=false 即可关闭降级，让错误真实暴露。
 */
export async function withDemo(handler, fallback) {
  try {
    return await handler()
  } catch (error) {
    if (!isDatabaseUnavailable(error) || !isDemoMode()) {
      if (isDatabaseUnavailable(error)) {
        throw createError({ statusCode: 503, statusMessage: '数据库暂不可用，请检查 DATABASE_URL 与迁移状态' })
      }
      throw error
    }
    return typeof fallback === 'function' ? await fallback() : fallback
  }
}

/**
 * 演示会话写操作路由
 * demo 账号（无数据库）只修改内存数据，不触碰真实数据库；
 * 真实管理员会话一律走 Prisma。
 */
export async function demoAware(event, handler, mutator) {
  if (event?.context?.admin?.id === 'demo') {
    return typeof mutator === 'function' ? await mutator() : mutator
  }
  return handler()
}

/** 分页参数解析 */
export function pagination(query = {}, defaultSize = 12) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const pageSize = Math.min(60, Math.max(1, Number.parseInt(query.pageSize, 10) || defaultSize))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function paged(list, total, page, pageSize) {
  return { list, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
