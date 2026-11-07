<script setup>
import { Swipe, SwipeItem } from 'vant'

const props = defineProps({ banners: { type: Array, default: () => [] } })
const { settings } = useSiteSettings()
const current = ref(0)
</script>

<template>
  <section class="relative overflow-hidden bg-paper-deep">
    <Swipe
      v-if="banners.length"
      :autoplay="6000"
      loop
      indicator-color="#b99456"
      class="h-[340px] w-full sm:h-[420px] md:h-[600px]"
      @change="(index) => (current = index)"
    >
      <SwipeItem v-for="(item, index) in banners" :key="item.id || index">
        <div class="relative h-full w-full">
          <SiteMediaImage
            :src="item.image"
            :alt="item.title"
            fill
            class="h-full w-full"
            sizes="100vw"
            :widths="[480, 800, 1200, 1600, 1920]"
            :priority="index === 0"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/10" />
          <!-- 文字层用绝对定位贴合轮播区，避免窄屏 h-full 高度链失效导致文案被裁切 -->
          <div class="absolute inset-0 z-10 flex items-center">
            <div class="cn-container w-full">
              <div class="max-w-xl text-paper">
                <p class="mb-2.5 text-[9px] tracking-[0.35em] text-gold-light sm:mb-5 sm:text-[11px] sm:tracking-[0.45em]">
                  YUN JIAN · {{ String(index + 1).padStart(2, '0') }}
                </p>
                <h1 class="cn-title text-[26px] leading-[1.35] text-white drop-shadow sm:text-3xl md:text-5xl md:leading-[1.4]">{{ item.title }}</h1>
                <p class="mt-3 line-clamp-2 text-xs tracking-[0.1em] text-paper-deep sm:mt-5 sm:text-sm sm:tracking-[0.15em] md:text-base">{{ item.subtitle }}</p>
                <NuxtLink
                  v-if="item.link"
                  :to="item.link"
                  class="mt-5 inline-flex border border-paper/60 px-5 py-2.5 text-[11px] tracking-[0.25em] text-white transition-colors hover:border-gold hover:text-gold-light sm:mt-8 sm:px-7 sm:py-3 sm:text-xs sm:tracking-[0.3em]"
                >细细看来 →</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </SwipeItem>
    </Swipe>

    <!-- 未配置轮播时的静态首屏 -->
    <div v-else class="cn-cloud-pattern relative flex h-[340px] items-center sm:h-[420px] md:h-[600px]">
      <div class="cn-container relative">
        <p class="mb-2.5 text-[9px] tracking-[0.35em] text-gold sm:mb-5 sm:text-[11px] sm:tracking-[0.45em]">YUN JIAN · ORIENTAL LIVING</p>
        <h1 class="cn-title text-[26px] leading-[1.35] sm:text-3xl md:text-5xl">{{ settings.homeHeroTitle || '一器一物，自有山河' }}</h1>
        <p class="mt-3 text-xs tracking-[0.1em] text-ink-soft sm:mt-5 sm:text-sm sm:tracking-[0.15em] md:text-base">{{ settings.homeHeroSubtitle || '以器物为媒，重拾东方生活的从容与雅致' }}</p>
        <NuxtLink to="/products" class="cn-btn-primary mt-5 sm:mt-8">寻访器物 →</NuxtLink>
      </div>
    </div>

    <div v-if="banners.length" class="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 text-[10px] tracking-[0.2em] text-paper/80 sm:bottom-8 sm:right-6 sm:gap-3 sm:text-xs sm:tracking-[0.3em]">
      <span class="text-sm text-gold-light sm:text-lg">{{ String(current + 1).padStart(2, '0') }}</span>
      <span class="h-px w-6 bg-paper/50 sm:w-10" />
      <span>{{ String(banners.length).padStart(2, '0') }}</span>
    </div>
  </section>
</template>
