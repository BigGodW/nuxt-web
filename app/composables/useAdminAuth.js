/** 管理后台登录态 */
export function useAdminAuth() {
  const user = useState('admin-user', () => null)
  const { get, post } = useApi()

  async function fetchMe() {
    try {
      const data = await get('/api/auth/me')
      user.value = data?.authenticated ? data.user : null
    } catch {
      user.value = null
    }
    return user.value
  }

  async function login(payload) {
    const data = await post('/api/auth/login', payload)
    user.value = data.user
    return data
  }

  async function logout() {
    try {
      await post('/api/auth/logout')
    } finally {
      user.value = null
    }
  }

  return { user, fetchMe, login, logout }
}
