<script setup>
const props = defineProps({ article: { type: Object, required: true } })
const category = computed(() => props.article.category?.name || '云涧手记')
</script>

<template>
  <NuxtLink :to="`/articles/${article.slug}`" class="cn-card group flex flex-col">
    <SiteMediaImage :src="article.coverImage" :alt="article.title" ratio="16 / 10" sizes="(max-width: 640px) 50vw, 33vw" />
    <div class="flex flex-1 flex-col p-3 sm:p-5">
      <div class="flex items-center gap-2 text-[10px] tracking-widest text-ink-muted sm:gap-3 sm:text-[11px]">
        <span class="truncate text-cinnabar">{{ category }}</span>
        <span class="hidden h-3 w-px shrink-0 bg-line sm:inline-block" />
        <span class="hidden shrink-0 sm:inline">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
      </div>
      <h3 class="cn-title mt-2 line-clamp-2 text-[14px] leading-snug transition-colors group-hover:text-cinnabar sm:mt-3 sm:text-lg sm:leading-relaxed">{{ article.title }}</h3>
      <p class="mt-2 hidden line-clamp-2 text-sm leading-7 text-ink-muted sm:line-clamp-2 sm:block">{{ article.summary }}</p>
      <div class="mt-auto hidden items-center justify-between pt-5 text-xs text-ink-muted sm:flex">
        <span>{{ article.viewCount || 0 }} 次阅读</span>
        <span class="tracking-widest text-cinnabar opacity-0 transition-opacity group-hover:opacity-100">阅读全文 →</span>
      </div>
    </div>
  </NuxtLink>
</template>
