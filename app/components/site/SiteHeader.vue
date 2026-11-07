<script setup>
import { Popup, Icon } from 'vant'

const route = useRoute()
const { settings } = useSiteSettings()
const mobileOpen = ref(false)

const menus = [
  { label: '首页', en: 'HOME', to: '/' },
  { label: '器物', en: 'OBJECTS', to: '/products' },
  { label: '文章', en: 'JOURNAL', to: '/articles' },
  { label: '关于', en: 'ABOUT', to: '/about' }
]

const isActive = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-sm">
    <div class="cn-container flex h-14 items-center justify-between md:h-20">
      <NuxtLink to="/" class="group flex items-center gap-2.5 sm:gap-3">
        <span class="cn-seal h-9 w-9 text-xs tracking-normal sm:h-10 sm:w-10 sm:text-sm md:h-11 md:w-11 md:text-base">{{ (settings.logoText || '云涧').slice(0, 2) }}</span>
        <span>
          <span class="block cn-title text-base leading-tight sm:text-lg">{{ settings.siteName || '云涧' }}</span>
          <span class="mt-0.5 hidden text-[9px] tracking-[0.22em] text-ink-muted sm:block">YUN JIAN · ORIENTAL LIVING</span>
        </span>
      </NuxtLink>

      <nav class="hidden items-center gap-8 md:flex lg:gap-11">
        <NuxtLink
          v-for="item in menus"
          :key="item.to"
          :to="item.to"
          class="group relative py-2 text-sm tracking-[0.2em] transition-colors"
          :class="isActive(item.to) ? 'text-cinnabar' : 'text-ink-soft hover:text-cinnabar'"
        >
          {{ item.label }}
          <span class="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-cinnabar transition-transform group-hover:scale-x-100" :class="isActive(item.to) ? 'scale-x-100' : ''" />
        </NuxtLink>
      </nav>

      <div class="hidden items-center gap-4 md:flex">
        <span class="h-4 w-px bg-line" />
        <NuxtLink to="/admin" class="text-xs tracking-[0.2em] text-ink-muted transition-colors hover:text-cinnabar">管理后台</NuxtLink>
      </div>

      <button class="flex h-10 w-10 items-center justify-center text-ink md:hidden" aria-label="打开菜单" @click="mobileOpen = true">
        <Icon name="wap-nav" size="22" />
      </button>
    </div>
  </header>

  <Popup v-model:show="mobileOpen" position="right" :style="{ width: '80%', height: '100%' }">
    <div class="flex h-full flex-col bg-paper px-5 py-6 sm:px-6 sm:py-7">
      <div class="flex items-center justify-between border-b border-line pb-4 sm:pb-5">
        <div class="flex items-center gap-3">
          <span class="cn-seal h-9 w-9 text-xs tracking-normal sm:h-10 sm:w-10 sm:text-sm">{{ (settings.logoText || '云涧').slice(0, 2) }}</span>
          <span class="cn-title text-base sm:text-lg">{{ settings.siteName || '云涧' }}</span>
        </div>
        <button class="text-2xl text-ink-muted" aria-label="关闭菜单" @click="mobileOpen = false">×</button>
      </div>

      <nav class="mt-4 flex-1 sm:mt-6">
        <NuxtLink
          v-for="(item, index) in menus"
          :key="item.to"
          :to="item.to"
          class="flex items-baseline justify-between border-b border-line/70 py-4 sm:py-5"
          :class="isActive(item.to) ? 'text-cinnabar' : 'text-ink'"
          @click="mobileOpen = false"
        >
          <span class="font-serif-cn text-lg tracking-[0.2em] sm:text-xl">{{ item.label }}</span>
          <span class="text-[9px] tracking-[0.2em] text-ink-muted sm:text-[10px] sm:tracking-[0.3em]">0{{ index + 1 }} / {{ item.en }}</span>
        </NuxtLink>
        <NuxtLink to="/admin" class="mt-5 block text-xs tracking-widest text-ink-muted sm:mt-6 sm:text-sm" @click="mobileOpen = false">管理后台 →</NuxtLink>
      </nav>

      <div class="border-t border-line pt-4 text-[11px] leading-6 text-ink-muted sm:pt-5 sm:text-xs sm:leading-7">
        <p>{{ settings.siteSlogan || '东方器物 · 生活美学' }}</p>
        <p>{{ settings.contactPhone || '400-800-2026' }}</p>
      </div>
    </div>
  </Popup>
</template>
