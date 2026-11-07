/**
 * 管理端 API 统一鉴权中间件
 * ------------------------------------------------------------
 * /api/admin/** 全部要求登录（登录接口在 /api/auth/**，不受影响）。
 * 校验通过后把管理员信息挂到 event.context.admin，供各业务路由使用。
 */
import { getCurrentAdmin } from '../utils/auth.js'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin/')) return

  const admin = await getCurrentAdmin(event)
  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: '请先登录管理后台' })
  }
  event.context.admin = admin
})
