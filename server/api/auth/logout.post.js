/** POST /api/auth/logout —— 退出登录 */
import { ok } from '../../utils/response.js'
import { clearSessionCookie } from '../../utils/auth.js'

export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return ok({ loggedOut: true })
})
