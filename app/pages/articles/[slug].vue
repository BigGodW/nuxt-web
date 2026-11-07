<script setup>
import { toShareCardImage } from '../../utils/share.js'

const route = useRoute()
const slug = route.params.slug
const { get } = useApi()

const { data: article } = await useAsyncData(`site-article-${slug}`, () => get(`/api/articles/${slug}`).catch(() => null))
const bodyHtml = computed(() => renderMarkdown(article.value?.content || ''))

// 微信 / 微博 / 抖音抓取分享卡片时读取 OG 信息，图片必须是绝对地址
const requestUrl = useRequestURL()
const runtime = useRuntimeConfig()
const pageUrl = computed(() => requestUrl.href)
const ogImage = computed(() => toShareCardImage(
  imageUrl(article.value?.coverImage || ''),
  { origin: requestUrl.origin, cdnDomain: runtime.public?.qiniuCdnDomain || '' }
))

useSeoMeta({
  title: () => article.value?.title || '文章',
  description: () => article.value?.summary || '',
  ogTitle: () => article.value?.title || '文章',
  ogDescription: () => article.value?.summary || '',
  ogImage: () => ogImage.value,
  ogType: 'article',
  ogUrl: () => pageUrl.value,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div v-if="article" class="cn-container py-7 sm:py-10 md:py-16">
    <nav class="flex flex-wrap items-center gap-1.5 text-[11px] tracking-widest text-ink-muted sm:gap-2 sm:text-xs">
      <NuxtLink to="/" class="hover:text-cinnabar">首页</NuxtLink>
      <span>/</span>
      <NuxtLink to="/articles" class="hover:text-cinnabar">器物志</NuxtLink>
      <span>/</span>
      <span class="text-cinnabar">{{ article.category?.name || '文章' }}</span>
    </nav>

    <article class="mx-auto mt-5 max-w-3xl sm:mt-8">
      <header class="text-center">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.45em]">{{ article.category?.name || 'YUN JIAN JOURNAL' }}</p>
        <h1 class="cn-title mt-3 text-[26px] leading-[1.4] sm:mt-5 sm:text-3xl md:text-[42px]">{{ article.title }}</h1>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] tracking-widest text-ink-muted sm:mt-6 sm:gap-4 sm:text-xs">
          <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
          <span class="h-3 w-px bg-line" />
          <span>{{ article.author }}</span>
          <span class="h-3 w-px bg-line" />
          <span>{{ article.viewCount || 0 }} 次阅读</span>
        </div>
        <div class="mt-4 flex justify-center sm:mt-5">
          <SiteShareButton
            kind="article"
            :title="article.title"
            :summary="article.summary"
            :image="article.coverImage"
            :tag="article.category?.name || '器物志'"
            :url="pageUrl"
          />
        </div>
        <div class="cn-divider my-6 sm:my-9"><span>◆</span></div>
      </header>

      <div v-if="article.coverImage" class="cn-frame mb-6 sm:mb-10">
        <SiteMediaImage :src="article.coverImage" :alt="article.title" ratio="16 / 9" sizes="(max-width: 768px) 100vw, 70vw" priority />
      </div>

      <p v-if="article.summary" class="border-l-2 border-gold bg-paper-deep/40 px-4 py-3 font-serif-cn text-sm leading-7 text-ink-soft sm:px-6 sm:py-4 sm:text-base sm:leading-8">{{ article.summary }}</p>

      <div class="prose-cn mt-6 sm:mt-10" v-html="bodyHtml" />

      <div v-if="article.tags?.length" class="mt-8 flex flex-wrap gap-2 border-t border-line pt-5 sm:mt-12 sm:pt-6">
        <span v-for="tag in article.tags" :key="tag" class="admin-tag text-ink-muted"># {{ tag }}</span>
      </div>

      <nav class="mt-8 grid gap-3 border-t border-line pt-6 sm:mt-10 sm:gap-4 sm:pt-8 sm:grid-cols-2">
        <NuxtLink v-if="article.prev" :to="`/articles/${article.prev.slug}`" class="cn-frame p-4 transition-colors hover:border-cinnabar sm:p-5">
          <span class="text-[10px] tracking-widest text-ink-muted">上一篇</span>
          <p class="cn-title mt-2 line-clamp-1 text-[15px] sm:text-base">{{ article.prev.title }}</p>
        </NuxtLink>
        <span v-else class="hidden sm:block" />
        <NuxtLink v-if="article.next" :to="`/articles/${article.next.slug}`" class="cn-frame p-4 text-right transition-colors hover:border-cinnabar sm:p-5">
          <span class="text-[10px] tracking-widest text-ink-muted">下一篇</span>
          <p class="cn-title mt-2 line-clamp-1 text-[15px] sm:text-base">{{ article.next.title }}</p>
        </NuxtLink>
      </nav>

      <div class="mt-8 text-center sm:mt-12">
        <NuxtLink to="/articles" class="cn-btn-ghost">返回文章列表</NuxtLink>
      </div>
    </article>
  </div>
  <div v-else class="cn-container py-16">
    <SiteEmptyState text="这篇文章已不见踪影" />
  </div>
</template>
