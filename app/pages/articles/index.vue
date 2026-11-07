<script setup>
import { Tabs, Tab, Search } from 'vant'

const route = useRoute()
const router = useRouter()
const { get } = useApi()

const { data: categories } = await useAsyncData('site-article-categories', () => get('/api/article-categories'))
const keyword = ref(String(route.query.keyword || ''))
const page = ref(Number(route.query.page) || 1)
const category = ref(String(route.query.category || ''))
const activeTab = ref(Math.max(0, (categories.value || []).findIndex((item) => item.slug === category.value) + 1))

const { data: result, refresh, pending } = await useAsyncData(
  'site-article-list',
  () => get('/api/articles', { page: page.value, pageSize: 9, category: category.value, keyword: keyword.value }),
  { watch: [page, category] }
)

function syncUrl() {
  const query = {}
  if (category.value) query.category = category.value
  if (keyword.value) query.keyword = keyword.value
  if (page.value > 1) query.page = page.value
  router.replace({ path: '/articles', query })
}

function onTabChange(index) {
  category.value = index === 0 ? '' : (categories.value?.[index - 1]?.slug || '')
  page.value = 1
  syncUrl()
}

function onSearch() {
  page.value = 1
  refresh()
  syncUrl()
}

function goPage(target) {
  page.value = target
  syncUrl()
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

useHead({ title: '器物志 · 文章' })
</script>

<template>
  <div>
    <!-- 页头 -->
    <section class="cn-page-head cn-cloud-pattern border-b border-line">
      <div class="cn-container">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.45em]">JOURNAL · 器物志</p>
        <h1 class="cn-title mt-3 text-[26px] sm:mt-4 sm:text-3xl md:text-4xl">文字里的慢时光</h1>
        <p class="mt-3 max-w-xl text-[13px] leading-6 text-ink-muted sm:mt-4 sm:text-sm sm:leading-7">关于手艺、茶事，以及把审美落进日常的一些记录。</p>
      </div>
    </section>

    <div class="cn-container py-7 sm:py-10 md:py-14">
      <!-- 分类 + 搜索 -->
      <div class="flex flex-col gap-3 border-b border-line pb-4 sm:gap-5 sm:pb-6 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <Tabs v-model:active="activeTab" :ellipsis="false" line-width="24px" line-height="2px" title-active-color="#a8322d" color="#4a453d" @change="onTabChange">
            <Tab title="全部">&#8203;</Tab>
            <Tab v-for="item in (categories || [])" :key="item.id" :title="item.name">&#8203;</Tab>
          </Tabs>
        </div>
        <div class="w-full md:w-64">
          <Search v-model="keyword" placeholder="搜索文章标题 / 关键词" @search="onSearch" @clear="onSearch" />
        </div>
      </div>

      <!-- 列表 -->
      <div v-if="pending" class="grid grid-cols-2 gap-3 pt-6 sm:gap-6 md:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-52 animate-pulse border border-line bg-paper-deep/50 sm:h-80" />
      </div>
      <div v-else-if="result?.list?.length" class="grid grid-cols-2 gap-3 pt-6 sm:gap-6 sm:pt-8 md:grid-cols-3 md:gap-7 md:pt-10">
        <SiteArticleCard v-for="item in result.list" :key="item.id" :article="item" />
      </div>
      <div v-else class="pt-8"><SiteEmptyState text="没有找到相关文章" /></div>

      <!-- 分页 -->
      <div v-if="result?.totalPages > 1" class="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:mt-12 sm:gap-2">
        <button class="admin-btn !px-2.5 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <button
          v-for="n in result.totalPages"
          :key="n"
          class="h-8 w-8 border text-xs transition-colors sm:h-9 sm:w-9 sm:text-sm"
          :class="n === page ? 'border-cinnabar bg-cinnabar text-white' : 'border-line text-ink-soft hover:border-cinnabar'"
          @click="goPage(n)"
        >{{ n }}</button>
        <button class="admin-btn !px-2.5 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm" :disabled="page >= result.totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
      <p v-if="result?.total" class="mt-4 text-center text-[11px] tracking-widest text-ink-muted sm:mt-6 sm:text-xs">共 {{ result.total }} 篇文字</p>
    </div>
  </div>
</template>
