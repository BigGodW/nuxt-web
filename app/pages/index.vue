<script setup>
const { get } = useApi()
const { settings, banners, loadBanners } = useSiteSettings()

const { data: featured } = await useAsyncData('home-featured-products', () => get('/api/products', { featured: 'true', limit: 4 }))
const { data: articles } = await useAsyncData('home-articles', () => get('/api/articles', { pageSize: 3 }))
const { data: categories } = await useAsyncData('home-product-categories', () => get('/api/product-categories'))
await loadBanners('HOME')

useHead({ title: '东方器物与生活美学' })

const principles = [
  { no: '壹', title: '甄选', desc: '走访产地与匠人，只留经得起日常使用的器物。' },
  { no: '贰', title: '手作', desc: '尊重手工留下的细微差异，那是时间的签名。' },
  { no: '叁', title: '养物', desc: '器物不是陈列品，用得越久，越有自己的样子。' }
]
</script>

<template>
  <div>
    <SiteHeroCarousel :banners="banners" />

    <!-- 品牌引子 -->
    <section class="cn-section cn-container">
      <div class="grid items-center gap-7 md:grid-cols-12 md:gap-12">
        <div class="md:col-span-5">
          <SiteSectionHeading en="OUR PHILOSOPHY" title="器以载道，物以养心" subtitle="我们相信，美不在远处，而在一只茶盏的温度、一缕沉香的起落之间。" />
          <NuxtLink to="/about" class="cn-btn-ghost mt-5 sm:mt-8">了解云涧 →</NuxtLink>
        </div>
        <!-- 手机三列小卡，避免三张竖排大卡把首屏拉长 -->
        <div class="grid grid-cols-3 gap-2.5 md:col-span-7 md:gap-6">
          <div v-for="item in principles" :key="item.no" class="cn-frame p-2.5 text-center sm:p-6">
            <span class="font-serif-cn text-xl text-cinnabar sm:text-3xl">{{ item.no }}</span>
            <h3 class="cn-title mt-1 text-[13px] sm:mt-4 sm:text-lg">{{ item.title }}</h3>
            <p class="mt-3 hidden text-xs leading-6 text-ink-muted sm:block">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 精选器物 -->
    <section class="cn-section border-y border-line bg-paper-deep/40">
      <div class="cn-container">
        <div class="flex flex-wrap items-end justify-between gap-3 sm:gap-6">
          <SiteSectionHeading en="SELECTED OBJECTS" title="精选器物" subtitle="每一件都经挑选，愿它能长久地留在你的日常里。" />
          <NuxtLink to="/products" class="ml-auto border-b border-cinnabar pb-1 text-[11px] tracking-[0.2em] text-cinnabar sm:text-xs sm:tracking-[0.28em]">全部器物 →</NuxtLink>
        </div>
        <div v-if="featured?.list?.length" class="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-4">
          <SiteProductCard v-for="item in featured.list" :key="item.id" :product="item" />
        </div>
        <SiteEmptyState v-else text="器物正在路上，稍后见" />
      </div>
    </section>

    <!-- 器物志 -->
    <section class="cn-section cn-container">
      <SiteSectionHeading en="JOURNAL" title="器物志" subtitle="关于手艺、茶事，以及把审美落进日常的一些记录。" center />
      <div v-if="articles?.list?.length" class="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:mt-12 md:grid-cols-3">
        <SiteArticleCard v-for="item in articles.list" :key="item.id" :article="item" />
      </div>
      <div class="mt-8 text-center sm:mt-12">
        <NuxtLink to="/articles" class="cn-btn-ghost">阅读全部文章 →</NuxtLink>
      </div>
    </section>

    <!-- 品类导航 -->
    <section class="cn-section bg-ink text-paper">
      <div class="cn-container">
        <SiteSectionHeading en="CATEGORIES" title="循类寻访" subtitle="茶、瓷、香、文房，四条路径，慢慢走。" center />
        <div class="mt-7 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
          <NuxtLink
            v-for="(item, index) in (categories || []).slice(0, 4)"
            :key="item.id"
            :to="`/products?category=${item.slug}`"
            class="group relative overflow-hidden border border-paper/20"
          >
            <SiteMediaImage :src="item.image" :alt="item.name" ratio="3 / 4" sizes="(max-width: 640px) 50vw, 25vw" class="opacity-80 transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
            <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
              <p class="text-[9px] tracking-[0.3em] text-gold-light sm:text-[10px] sm:tracking-[0.35em]">0{{ index + 1 }}</p>
              <h3 class="cn-title mt-1.5 text-lg text-white sm:mt-2 sm:text-2xl">{{ item.name }}</h3>
              <p class="mt-1 hidden text-xs text-paper/70 sm:block">{{ item.description }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 品牌故事 CTA -->
    <section class="cn-section cn-cloud-pattern cn-container">
      <div class="cn-frame mx-auto max-w-3xl px-5 py-9 text-center sm:px-8 sm:py-14 md:px-16">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.45em]">ABOUT YUN JIAN</p>
        <h2 class="cn-title mt-4 text-xl sm:mt-5 sm:text-2xl md:text-3xl">{{ settings.homeQuote || '器以载道，物以养心' }}</h2>
        <p class="mx-auto mt-4 max-w-xl text-[13px] leading-7 text-ink-soft sm:mt-6 sm:text-sm sm:leading-8">{{ settings.aboutStory || '云涧始于对日常器物的注视，把经得起时间的东西带回当下。' }}</p>
        <NuxtLink to="/about" class="cn-btn-primary mt-6 sm:mt-8">走进云涧 →</NuxtLink>
      </div>
    </section>
  </div>
</template>
