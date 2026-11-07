<script setup>
import { Popup, Icon, showConfirmDialog, showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const { user, fetchMe, logout } = useAdminAuth()
const sidebarOpen = ref(false)

const menus = [
  { label: '仪表盘', icon: 'wap-home-o', to: '/admin' },
  { label: '文章管理', icon: 'notes-o', to: '/admin/articles' },
  { label: '商品管理', icon: 'goods-collect-o', to: '/admin/products' },
  { label: '分类与类型', icon: 'apps-o', to: '/admin/categories' },
  { label: '轮播图', icon: 'photo-o', to: '/admin/banners' },
  { label: '网站信息', icon: 'setting-o', to: '/admin/settings' },
  { label: '媒体库', icon: 'photo-fail-o', to: '/admin/media' }
]

const groups = [
  { title: '内容', items: menus.slice(0, 3) },
  { title: '站点', items: menus.slice(3) }
]

const currentTitle = computed(() => menus.find((item) => item.to === route.path)?.label || '管理后台')
const isActive = (to) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))

await fetchMe()

async function onLogout() {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定要退出管理后台吗？' })
  } catch { return }
  await logout()
  showToast('已退出')
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- PC 侧边栏 -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-paper-card md:flex">
      <div class="flex h-20 items-center gap-3 border-b border-line px-6">
        <span class="cn-seal h-10 w-10 text-sm tracking-normal">云涧</span>
        <div>
          <p class="cn-title text-base">云涧 · 管理</p>
          <p class="text-[10px] tracking-[0.2em] text-ink-muted">ADMIN CONSOLE</p>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-5">
        <div v-for="group in groups" :key="group.title" class="mb-6">
          <p class="px-3 pb-2 text-[10px] tracking-[0.3em] text-ink-muted">{{ group.title }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="mb-1 flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors"
            :class="isActive(item.to) ? 'border-cinnabar bg-cinnabar/5 font-medium text-cinnabar' : 'border-transparent text-ink-soft hover:bg-paper-deep/60'"
          >
            <Icon :name="item.icon" size="17" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>
      <div class="border-t border-line p-4">
        <NuxtLink to="/" target="_blank" class="flex items-center gap-2 px-2 py-2 text-xs text-ink-muted hover:text-cinnabar">
          <Icon name="eye-o" /> 查看站点前台 →
        </NuxtLink>
      </div>
    </aside>

    <!-- 顶栏 -->
    <header class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper-card/95 px-3 backdrop-blur sm:h-16 sm:px-4 md:ml-60 md:px-8">
      <div class="flex items-center gap-2.5 sm:gap-3">
        <button class="text-xl text-ink md:hidden" aria-label="菜单" @click="sidebarOpen = true"><Icon name="wap-nav" /></button>
        <h1 class="cn-title text-[15px] sm:text-base md:text-lg">{{ currentTitle }}</h1>
      </div>
      <div class="flex items-center gap-2.5 sm:gap-4">
        <span class="hidden text-xs text-ink-muted sm:inline">{{ user?.nickname || user?.username || '管理员' }}</span>
        <span class="cn-seal h-7 w-7 text-[11px] tracking-normal sm:h-8 sm:w-8 sm:text-xs">{{ (user?.nickname || '管').slice(0, 1) }}</span>
        <button class="text-[11px] text-ink-muted transition-colors hover:text-cinnabar sm:text-xs" @click="onLogout">退出</button>
      </div>
    </header>

    <!-- 内容 -->
    <main class="p-3 sm:p-4 md:ml-60 md:p-8">
      <slot />
    </main>

    <!-- 移动端侧边栏 -->
    <Popup v-model:show="sidebarOpen" position="left" :style="{ width: '76%', height: '100%' }">
      <div class="flex h-full flex-col bg-paper-card">
        <div class="flex h-20 items-center gap-3 border-b border-line px-5">
          <span class="cn-seal h-10 w-10 text-sm tracking-normal">云涧</span>
          <span class="cn-title text-base">云涧 · 管理</span>
        </div>
        <nav class="flex-1 overflow-y-auto px-3 py-5">
          <div v-for="group in groups" :key="group.title" class="mb-5">
            <p class="px-3 pb-2 text-[10px] tracking-[0.3em] text-ink-muted">{{ group.title }}</p>
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="mb-1 flex items-center gap-3 px-3 py-2.5 text-sm"
              :class="isActive(item.to) ? 'bg-cinnabar/5 text-cinnabar' : 'text-ink-soft'"
              @click="sidebarOpen = false"
            >
              <Icon :name="item.icon" size="17" /> {{ item.label }}
            </NuxtLink>
          </div>
          <NuxtLink to="/" target="_blank" class="block px-3 py-2 text-xs text-ink-muted" @click="sidebarOpen = false">查看站点前台 →</NuxtLink>
        </nav>
      </div>
    </Popup>
  </div>
</template>
