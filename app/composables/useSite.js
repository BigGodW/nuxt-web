/**
 * 站点全局信息（布局、页脚、SEO 共用）
 * 使用 useState 做 SSR 友好的请求去重。
 */
export function useSiteSettings() {
  const settings = useState('site-settings', () => ({}))
  const banners = useState('site-banners', () => [])
  const { get } = useApi()

  async function loadSettings(force = false) {
    if (!force && Object.keys(settings.value || {}).length) return settings.value
    try {
      settings.value = await get('/api/site/settings')
    } catch {
      settings.value = {}
    }
    return settings.value
  }

  async function loadBanners(position = 'HOME') {
    try {
      banners.value = await get('/api/site/banners', { position })
    } catch {
      banners.value = []
    }
    return banners.value
  }

  return { settings, banners, loadSettings, loadBanners }
}
