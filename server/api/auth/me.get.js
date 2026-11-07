/** GET /api/auth/me —— 当前登录态（供路由守卫与后台顶栏使用） */
import { ok } from '../../utils/response.js'
import { getCurrentAdmin } from '../../utils/auth.js'

export default defineEventHandler(async (event) => {
  const user = await getCurrentAdmin(event)
  return ok({ authenticated: Boolean(user), user: user || null })
})
