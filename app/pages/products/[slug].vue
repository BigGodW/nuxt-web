<script setup>
import { Swipe, SwipeItem, Button, showToast } from 'vant'
import { toShareCardImage } from '../../utils/share.js'

const route = useRoute()
const slug = route.params.slug
const { get } = useApi()
const { data: product } = await useAsyncData(`site-product-${slug}`, () => get(`/api/products/${slug}`).catch(() => null))

const current = ref(0)
const swipeRef = ref(null)
const carousel = computed(() => (product.value?.images || []).filter((item) => item.kind !== 'DETAIL'))
const displayImages = computed(() => carousel.value.length ? carousel.value.map((item) => item.url) : [product.value?.coverImage].filter(Boolean))
const detailImages = computed(() => (product.value?.images || []).filter((item) => item.kind === 'DETAIL'))
const detailHtml = computed(() => renderMarkdown(product.value?.description || ''))
const specs = computed(() => Array.isArray(product.value?.specs) ? product.value.specs : [])

const attributes = computed(() => [
  { label: '产地', value: product.value?.origin },
  { label: '材质', value: product.value?.material },
  { label: '工艺', value: product.value?.craft },
  { label: '包装', value: product.value?.packageInfo },
  { label: '品类', value: product.value?.category?.name },
  { label: '类型', value: product.value?.type?.name }
].filter((item) => item.value))

function goImage(index) {
  current.value = index
  swipeRef.value?.swipeTo(index)
}

// 分享卡片 OG 信息（微信 / 微博 / 抖音抓取）
const requestUrl = useRequestURL()
const runtime = useRuntimeConfig()
const pageUrl = computed(() => requestUrl.href)
const ogImage = computed(() => toShareCardImage(
  imageUrl(product.value?.coverImage || ''),
  { origin: requestUrl.origin, cdnDomain: runtime.public?.qiniuCdnDomain || '' }
))

useSeoMeta({
  title: () => product.value?.name || '器物',
  description: () => product.value?.summary || '',
  ogTitle: () => product.value?.name || '器物',
  ogDescription: () => product.value?.summary || '',
  ogImage: () => ogImage.value,
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div v-if="product" class="cn-container py-7 sm:py-10 md:py-14">
    <nav class="flex flex-wrap items-center gap-1.5 text-[11px] tracking-widest text-ink-muted sm:gap-2 sm:text-xs">
      <NuxtLink to="/" class="hover:text-cinnabar">首页</NuxtLink><span>/</span>
      <NuxtLink to="/products" class="hover:text-cinnabar">器物</NuxtLink><span>/</span>
      <span class="text-cinnabar">{{ product.category?.name || '全部' }}</span>
    </nav>

    <div class="mt-6 grid gap-7 sm:mt-8 sm:gap-10 md:grid-cols-2 md:gap-14">
      <!-- 轮播图 -->
      <div class="min-w-0">
        <div class="cn-frame">
          <Swipe
            v-if="displayImages.length"
            ref="swipeRef"
            :autoplay="5000"
            loop
            class="h-[300px] w-full sm:h-[380px] md:h-[480px]"
            @change="(i) => (current = i)"
          >
            <SwipeItem v-for="(url, index) in displayImages" :key="`${url}-${index}`">
              <div class="relative h-full w-full">
                <SiteMediaImage :src="url" :alt="`${product.name} 图 ${index + 1}`" fill sizes="(max-width: 768px) 100vw, 55vw" :priority="index === 0" />
              </div>
            </SwipeItem>
          </Swipe>
          <SiteMediaImage v-else :src="product.coverImage" :alt="product.name" ratio="1 / 1" sizes="(max-width: 768px) 100vw, 55vw" priority />
        </div>
        <div v-if="displayImages.length > 1" class="mt-2.5 grid grid-cols-5 gap-1.5 sm:mt-3 sm:gap-2">
          <button
            v-for="(url, index) in displayImages.slice(0, 5)"
            :key="`thumb-${index}`"
            class="overflow-hidden border transition-colors"
            :class="current === index ? 'border-cinnabar' : 'border-line hover:border-gold'"
            @click="goImage(index)"
          >
            <SiteMediaImage :src="url" :alt="`缩略图 ${index + 1}`" ratio="1 / 1" sizes="72px" :widths="[96, 160, 240]" />
          </button>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="min-w-0">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.4em]">{{ product.category?.name || 'ORIENTAL OBJECTS' }}</p>
        <h1 class="cn-title mt-3 text-xl leading-snug sm:mt-4 sm:text-2xl md:text-3xl">{{ product.name }}</h1>
        <p class="mt-1.5 text-xs tracking-widest text-ink-muted sm:mt-2 sm:text-sm">{{ product.subtitle }}</p>

        <div class="my-5 border-y border-line py-4 sm:my-7 sm:py-5">
          <div class="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span class="font-serif-cn text-2xl text-cinnabar sm:text-3xl">{{ formatPrice(product.price) }}</span>
            <span v-if="product.originalPrice && Number(product.originalPrice) > Number(product.price)" class="text-xs text-ink-muted line-through sm:text-sm">{{ formatPrice(product.originalPrice) }}</span>
            <span class="ml-auto text-[11px] text-ink-muted sm:text-xs">/ {{ product.unit || '件' }}</span>
          </div>
          <p class="mt-1.5 text-[11px] text-ink-muted sm:mt-2 sm:text-xs">库存 {{ product.stock }} {{ product.unit || '件' }} · {{ product.viewCount || 0 }} 人看过</p>
        </div>

        <p class="text-[13px] leading-7 text-ink-soft sm:text-sm sm:leading-8">{{ product.summary }}</p>

        <!-- 手机单列参数，避免两列挤压长文本 -->
        <dl v-if="attributes.length" class="mt-5 grid grid-cols-1 gap-x-4 gap-y-2 border border-line bg-paper-deep/30 p-4 sm:mt-7 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 sm:p-5">
          <div v-for="item in attributes" :key="item.label" class="flex gap-2 text-[13px] sm:gap-3 sm:text-sm">
            <dt class="w-11 shrink-0 text-ink-muted sm:w-12">{{ item.label }}</dt>
            <dd class="min-w-0 break-words text-ink-soft">{{ item.value }}</dd>
          </div>
        </dl>

        <div v-if="specs.length" class="mt-5 sm:mt-6">
          <h3 class="cn-title text-[15px] sm:text-base">规格参数</h3>
          <div class="mt-2.5 border border-line sm:mt-3">
            <div v-for="(item, index) in specs" :key="index" class="flex border-b border-line/70 text-[13px] last:border-0 sm:text-sm">
              <span class="w-20 shrink-0 bg-paper-deep/40 px-3 py-2 text-ink-muted sm:w-28 sm:px-4 sm:py-2.5">{{ item.name }}</span>
              <span class="min-w-0 break-words px-3 py-2 text-ink-soft sm:px-4 sm:py-2.5">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div v-if="product.tags?.length" class="mt-5 flex flex-wrap gap-2 sm:mt-6">
          <span v-for="tag in product.tags" :key="tag" class="admin-tag"># {{ tag }}</span>
        </div>

        <div class="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
          <Button class="!h-11 !flex-1 !border-cinnabar !bg-cinnabar !text-[13px] !tracking-[0.25em] !text-white sm:!h-12 sm:!text-sm sm:!tracking-[0.3em]" @click="showToast('已记录意向，可通过页面底部联系方式咨询')">咨询此器物</Button>
          <NuxtLink to="/products" class="admin-btn !h-11 !flex-1 !text-[13px] !tracking-[0.25em] sm:!h-12 sm:!text-sm sm:!tracking-[0.3em]">继续寻访</NuxtLink>
        </div>
        <div class="mt-3 flex justify-center sm:mt-4">
          <SiteShareButton
            kind="product"
            :title="product.name"
            :summary="product.summary"
            :image="product.coverImage"
            :price="formatPrice(product.price)"
            :tag="product.category?.name || '东方器物'"
            :url="pageUrl"
          />
        </div>
        <p class="mt-3 text-[11px] leading-5 text-ink-muted sm:mt-4 sm:text-xs sm:leading-6">手作器物存在细微色差与纹理差异，正是独属于每一件的印记。</p>
      </div>
    </div>

    <!-- 详情 -->
    <section class="mt-10 grid gap-8 sm:mt-16 sm:gap-12 md:grid-cols-12">
      <div class="min-w-0 md:col-span-8">
        <div class="flex items-center gap-3 border-b border-line pb-3 sm:gap-4 sm:pb-4">
          <h2 class="cn-title text-lg sm:text-xl">器物详情</h2>
          <span class="h-px flex-1 bg-line" />
        </div>
        <div class="prose-cn mt-5 sm:mt-6" v-html="detailHtml" />
        <div v-for="(item, index) in detailImages" :key="item.id || index" class="mt-5 sm:mt-6">
          <SiteMediaImage :src="item.url" :alt="item.alt || product.name" ratio="4 / 3" sizes="(max-width: 768px) 100vw, 66vw" />
        </div>
      </div>
      <aside class="md:col-span-4">
        <div class="cn-frame bg-ink p-5 text-paper sm:p-7">
          <p class="text-[9px] tracking-[0.35em] text-gold-light sm:text-[10px] sm:tracking-[0.4em]">CARE & SERVICE</p>
          <h3 class="cn-title mt-2.5 text-lg text-white sm:mt-3 sm:text-xl">关于养护</h3>
          <ul class="mt-4 space-y-2 text-[13px] leading-6 text-paper/75 sm:mt-5 sm:space-y-3 sm:text-sm sm:leading-7">
            <li>· 避免骤冷骤热，清水手洗为佳</li>
            <li>· 收纳时以软布相隔，避免磕碰</li>
            <li>· 木作与瓷器会随使用渐生色泽</li>
            <li>· 需要帮助，可通过页脚方式联系我们</li>
          </ul>
        </div>
      </aside>
    </section>

    <!-- 相关推荐 -->
    <section v-if="product.related?.length" class="mt-12 sm:mt-20">
      <SiteSectionHeading en="YOU MAY ALSO LIKE" title="或许也合心意" />
      <div class="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-4">
        <SiteProductCard v-for="item in product.related" :key="item.slug" :product="item" />
      </div>
    </section>
  </div>
  <div v-else class="cn-container py-16"><SiteEmptyState text="这件器物暂不可见" /></div>
</template>
