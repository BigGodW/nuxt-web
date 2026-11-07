<script setup>
const { settings } = useSiteSettings()
const year = new Date().getFullYear()
const menus = [
  { label: '首页', to: '/' },
  { label: '器物', to: '/products' },
  { label: '文章', to: '/articles' },
  { label: '关于云涧', to: '/about' }
]
</script>

<template>
  <footer class="cn-cloud-pattern mt-12 border-t border-line bg-paper-deep/60 sm:mt-16 md:mt-20">
    <div class="cn-container grid grid-cols-2 gap-x-5 gap-y-7 py-9 sm:gap-10 sm:py-12 md:grid-cols-12 md:py-16">
      <div class="col-span-2 md:col-span-5">
        <div class="flex items-center gap-3">
          <span class="cn-seal h-10 w-10 text-sm tracking-normal sm:h-11 sm:w-11 sm:text-base">{{ (settings.logoText || '云涧').slice(0, 2) }}</span>
          <div>
            <p class="cn-title text-lg sm:text-xl">{{ settings.siteName || '云涧' }}</p>
            <p class="mt-1 text-[9px] tracking-[0.2em] text-ink-muted sm:text-[10px]">YUN JIAN · ORIENTAL LIVING</p>
          </div>
        </div>
        <p class="mt-4 max-w-sm text-[13px] leading-7 text-ink-soft sm:mt-6 sm:text-sm sm:leading-8">{{ settings.siteDescription || '云涧甄选东方器物、茶瓷文房，以器物为引，记录有温度的日常。' }}</p>
        <div class="cn-divider mt-5 justify-start sm:mt-8"><span>◆</span></div>
      </div>

      <div class="md:col-span-3">
        <h3 class="cn-title text-[15px] sm:text-base">寻访</h3>
        <ul class="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
          <li v-for="item in menus" :key="item.to">
            <NuxtLink :to="item.to" class="text-[13px] tracking-widest text-ink-soft transition-colors hover:text-cinnabar sm:text-sm">{{ item.label }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div class="md:col-span-4">
        <h3 class="cn-title text-[15px] sm:text-base">相见</h3>
        <ul class="mt-3 space-y-2 text-[13px] leading-6 text-ink-soft sm:mt-5 sm:space-y-3 sm:text-sm">
          <li>电话　{{ settings.contactPhone || '400-800-2026' }}</li>
          <li>邮箱　{{ settings.contactEmail || 'hello@yunjian.cn' }}</li>
          <li>地址　{{ settings.address || '中国 · 杭州' }}</li>
        </ul>
        <div v-if="settings.wechatQr" class="mt-4 sm:mt-5">
          <SiteMediaImage :src="settings.wechatQr" alt="公众号二维码" ratio="1 / 1" sizes="96px" :widths="[96, 192]" class="w-20 border border-line sm:w-24" />
        </div>
      </div>
    </div>

    <div class="border-t border-line/70">
      <div class="cn-container flex flex-col items-center justify-between gap-1.5 py-4 text-[11px] text-ink-muted sm:gap-2 sm:py-5 sm:text-xs md:flex-row">
        <p>© {{ year }} {{ settings.siteName || '云涧' }} · {{ settings.footerNote || '愿日子清简，器物长伴。' }}</p>
        <p>{{ settings.icp || '' }}</p>
      </div>
    </div>
  </footer>
</template>
