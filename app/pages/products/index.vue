<script setup>
import { Popup, Search, Button, Icon, RadioGroup, Radio } from 'vant'

const route = useRoute()
const router = useRouter()
const { get } = useApi()

const { data: categories } = await useAsyncData('site-product-categories', () => get('/api/product-categories'))
const { data: types } = await useAsyncData('site-product-types', () => get('/api/product-types'))

const keyword = ref(String(route.query.keyword || ''))
const category = ref(String(route.query.category || ''))
const type = ref(String(route.query.type || ''))
const sort = ref(String(route.query.sort || 'default'))
const page = ref(Number(route.query.page) || 1)
const filterOpen = ref(false)

const { data: result, refresh, pending } = await useAsyncData(
  'site-product-list',
  () => get('/api/products', {
    page: page.value, pageSize: 9, category: category.value,
    type: type.value, keyword: keyword.value, sort: sort.value
  }),
  { watch: [page, category, type, sort] }
)

function syncUrl() {
  const query = {}
  if (category.value) query.category = category.value
  if (type.value) query.type = type.value
  if (keyword.value) query.keyword = keyword.value
  if (sort.value !== 'default') query.sort = sort.value
  if (page.value > 1) query.page = page.value
  router.replace({ path: '/products', query })
}

function selectCategory(slug) {
  category.value = category.value === slug ? '' : slug
  page.value = 1
  filterOpen.value = false
  syncUrl()
}

function selectType(slug) {
  type.value = type.value === slug ? '' : slug
  page.value = 1
  syncUrl()
}

function onSearch() {
  page.value = 1
  refresh()
  syncUrl()
}

function onFilterChange() {
  page.value = 1
  syncUrl()
}

function goPage(target) {
  page.value = target
  syncUrl()
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const flatCategories = computed(() => (categories.value || []).flatMap((parent) => [parent, ...(parent.children || [])]))
useHead({ title: '器物 · 全部商品' })
</script>

<template>
  <div>
    <section class="cn-page-head cn-cloud-pattern border-b border-line">
      <div class="cn-container">
        <p class="text-[9px] tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.45em]">OBJECTS · 器物</p>
        <h1 class="cn-title mt-3 text-[26px] sm:mt-4 sm:text-3xl md:text-4xl">循类寻访，慢慢挑</h1>
        <p class="mt-3 max-w-xl text-[13px] leading-6 text-ink-muted sm:mt-4 sm:text-sm sm:leading-7">茶、瓷、香、文房。每件器物都留下手作的温度，也等待被使用的时间。</p>
      </div>
    </section>

    <div class="cn-container grid gap-6 py-7 sm:py-10 md:grid-cols-12 md:gap-10 md:py-14">
      <!-- PC 侧栏筛选 -->
      <aside class="hidden md:col-span-3 md:block">
        <div class="sticky top-28">
          <div class="admin-card !p-5">
            <h2 class="cn-title border-b border-line pb-3 text-base">品种</h2>
            <ul class="mt-3 space-y-1">
              <li>
                <button class="flex w-full items-center justify-between px-1 py-2 text-sm" :class="!category ? 'text-cinnabar' : 'text-ink-soft hover:text-cinnabar'" @click="selectCategory('')">全部器物 <span class="text-xs text-ink-muted">{{ result?.total || 0 }}</span></button>
              </li>
              <li v-for="parent in (categories || [])" :key="parent.id">
                <button class="flex w-full items-center justify-between px-1 py-2 text-sm" :class="category === parent.slug ? 'text-cinnabar' : 'text-ink-soft hover:text-cinnabar'" @click="selectCategory(parent.slug)">
                  {{ parent.name }} <span class="text-xs text-ink-muted">{{ parent.count || '' }}</span>
                </button>
                <ul v-if="parent.children?.length" class="ml-3 border-l border-line pl-3">
                  <li v-for="child in parent.children" :key="child.id">
                    <button class="w-full py-1.5 text-left text-xs" :class="category === child.slug ? 'text-cinnabar' : 'text-ink-muted hover:text-cinnabar'" @click="selectCategory(child.slug)">— {{ child.name }}</button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div class="admin-card mt-5 !p-5">
            <h2 class="cn-title border-b border-line pb-3 text-base">类型</h2>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="item in (types || [])"
                :key="item.id"
                class="border px-3 py-1.5 text-xs transition-colors"
                :class="type === item.slug ? 'border-cinnabar bg-cinnabar text-white' : 'border-line text-ink-soft hover:border-cinnabar'"
                @click="selectType(item.slug)"
              >{{ item.name }}</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 商品区 -->
      <div class="min-w-0 md:col-span-9">
        <div class="flex items-center gap-2 border-b border-line pb-4 sm:gap-3 sm:pb-5">
          <div class="min-w-0 flex-1">
            <Search v-model="keyword" placeholder="搜索器物名称 / 关键词" @search="onSearch" @clear="onSearch" />
          </div>
          <select v-model="sort" class="admin-select hidden w-auto md:block" @change="onFilterChange">
            <option value="default">默认排序</option>
            <option value="featured">精选优先</option>
            <option value="new">最新上架</option>
          </select>
          <Button class="!shrink-0 !border-line !bg-white md:!hidden" size="small" @click="filterOpen = true">
            <Icon name="filter-o" class="mr-1" />筛选
          </Button>
        </div>

        <p class="mt-4 text-[11px] tracking-widest text-ink-muted sm:mt-5 sm:text-xs">
          共 <span class="text-cinnabar">{{ result?.total || 0 }}</span> 件器物
          <span v-if="category"> · {{ flatCategories.find((c) => c.slug === category)?.name || category }}</span>
        </p>

        <div v-if="pending" class="mt-5 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          <div v-for="n in 6" :key="n" class="h-52 animate-pulse border border-line bg-paper-deep/50 sm:h-80" />
        </div>
        <div v-else-if="result?.list?.length" class="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-3">
          <SiteProductCard v-for="item in result.list" :key="item.id" :product="item" />
        </div>
        <div v-else class="mt-6"><SiteEmptyState text="没有找到符合条件的器物" /></div>

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
      </div>
    </div>

    <!-- 移动端筛选抽屉 -->
    <Popup v-model:show="filterOpen" position="bottom" round :style="{ height: '68%' }">
      <div class="flex h-full flex-col bg-paper p-5 sm:p-6">
        <div class="flex items-center justify-between border-b border-line pb-3 sm:pb-4">
          <h3 class="cn-title text-base sm:text-lg">筛选器物</h3>
          <button class="text-2xl text-ink-muted" @click="filterOpen = false">×</button>
        </div>
        <div class="flex-1 overflow-y-auto py-4 sm:py-5">
          <p class="admin-label">品种</p>
          <RadioGroup v-model="category" class="!flex !flex-wrap !gap-2" @change="onFilterChange">
            <Radio v-for="item in flatCategories" :key="item.id" :name="item.slug" class="!mr-0 !border !border-line !px-3 !py-2">{{ item.name }}</Radio>
          </RadioGroup>
          <p class="admin-label mt-5 sm:mt-6">类型</p>
          <RadioGroup v-model="type" class="!flex !flex-wrap !gap-2" @change="onFilterChange">
            <Radio v-for="item in (types || [])" :key="item.id" :name="item.slug" class="!mr-0 !border !border-line !px-3 !py-2">{{ item.name }}</Radio>
          </RadioGroup>
        </div>
        <Button block class="!bg-cinnabar !border-cinnabar !text-white" @click="filterOpen = false">查看 {{ result?.total || 0 }} 件器物</Button>
      </div>
    </Popup>
  </div>
</template>
