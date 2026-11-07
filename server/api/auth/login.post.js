/** POST /api/auth/login —— 管理员登录 */
import { prisma } from '../../utils/prisma.js'
import { ok, isDatabaseUnavailable, isDemoMode } from '../../utils/response.js'
import { signSession, setSessionCookie, comparePassword, DEMO_ADMIN } from '../../utils/auth.js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  if (!username || !password) throw createError({ statusCode: 400, statusMessage: '请输入账号和密码' })

  let user
  try {
    user = await prisma.adminUser.findUnique({ where: { username } })
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error
    // 演示模式：数据库未就绪时允许 demo 账号进入后台
    if (isDemoMode() && username === 'admin' && password === 'admin123') {
      const token = await signSession({ sub: 'demo', username: DEMO_ADMIN.username, role: 'demo' })
      setSessionCookie(event, token)
      return ok({ user: DEMO_ADMIN, demo: true })
    }
    throw createError({ statusCode: 503, statusMessage: '数据库不可用，请检查 DATABASE_URL 与迁移状态' })
  }

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码不正确' })
  }

  await prisma.adminUser
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {})

  const token = await signSession({ sub: user.id, username: user.username, role: user.role })
  setSessionCookie(event, token)
  return ok({ user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role } })
})
