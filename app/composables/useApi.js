/**
 * 统一 API 客户端
 * ------------------------------------------------------------
 * 服务端所有接口返回 { code, message, data, meta? }
 * 这里统一拆包、统一抛错，页面只关心业务数据。
 */
export function useApi() {
  async function request(path, options = {}) {
    let res
    try {
      res = await $fetch(path, { ...options })
    } catch (error) {
      const message = error?.data?.message || error?.data?.statusMessage || error?.statusMessage || error?.message || '网络异常，请稍后重试'
      throw new Error(message)
    }
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) throw new Error(res.message || '请求失败')
      return res.data
    }
    return res
  }

  const get = (path, query) => request(path, { query })
  const post = (path, body) => request(path, { method: 'POST', body })
  const put = (path, body) => request(path, { method: 'PUT', body })
  const patch = (path, body) => request(path, { method: 'PATCH', body })
  const del = (path, query) => request(path, { method: 'DELETE', query })

  return { request, get, post, put, patch, del }
}
