/**
 * 管理后台路由守卫（全局）
 * ------------------------------------------------------------
 * /admin/** 除登录页外均要求已登录；登录态来自 httpOnly Cookie，
 * SSR 请求使用 useRequestFetch 转发浏览器 Cookie。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return

  if (import.meta.server) {
    const requestFetch = useRequestFetch()
    try {
      const res = await requestFetch('/api/auth/me')
      if (!res?.data?.authenticated) {
        return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
    } catch {
      return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    return
  }

  const { user, fetchMe } = useAdminAuth()
  if (!user.value) {
    const me = await fetchMe()
    if (!me) return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
