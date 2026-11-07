<script setup>
definePageMeta({ layout: 'admin' })

const { get } = useApi()
const { user } = useAdminAuth()
const { data: stats, refresh, pending } = await useAsyncData('admin-dashboard-stats', () => get('/api/admin/stats'))

const cards = computed(() => [
  { label: '文章总数', value: stats.value?.counts?.articles ?? '—', hint: `已发布 ${stats.value?.counts?.published ?? 0}`, to: '/admin/articles' },
  { label: '商品总数', value: stats.value?.counts?.products ?? '—', hint: `在售 ${stats.value?.counts?.onSale ?? 0}`, to: '/admin/products' },
  { label: '首页轮播', value: stats.value?.counts?.banners ?? '—', hint: '站点展示位', to: '/admin/banners' },
  { label: '商品品类', value: stats.value?.counts?.categories ?? '—', hint: '品种 / 类型', to: '/admin/categories' }
])

useHead({ title: '仪表盘' })
</script>

<template>
  <div>
    <AdminPageHeader :title="`早安，${user?.nickname || '管理员'}`" description="今天也把好器物与好文字整理妥当。">
      <template #actions>
        <button class="admin-btn" @click="refresh">刷新数据</button>
        <NuxtLink to="/" target="_blank" class="admin-btn">查看前台</NuxtLink>
      </template>
    </AdminPageHeader>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NuxtLink v-for="card in cards" :key="card.label" :to="card.to" class="admin-card group relative overflow-hidden transition-colors hover:border-cinnabar">
        <span class="absolute right-4 top-4 h-8 w-8 rotate-45 border border-line" />
        <p class="text-xs tracking-widest text-ink-muted">{{ card.label }}</p>
        <p class="cn-title mt-4 text-4xl">{{ pending ? '…' : card.value }}</p>
        <p class="mt-3 text-xs text-gold">{{ card.hint }}</p>
      </NuxtLink>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <section class="admin-card">
        <div class="flex items-center justify-between border-b border-line pb-4">
          <h3 class="cn-title text-base">最近文章</h3>
          <NuxtLink to="/admin/articles" class="text-xs text-cinnabar">管理 →</NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="admin-table !min-w-0">
            <thead><tr><th>标题</th><th class="w-20">状态</th><th class="w-24 text-right">阅读</th></tr></thead>
            <tbody>
              <tr v-for="item in (stats?.recentArticles || [])" :key="item.id">
                <td class="max-w-[240px] truncate text-ink">{{ item.title }}</td>
                <td><span class="admin-tag" :class="item.status === 'PUBLISHED' ? 'text-jade' : 'text-ink-muted'">{{ STATUS_TEXT[item.status] || item.status }}</span></td>
                <td class="text-right">{{ item.viewCount || 0 }}</td>
              </tr>
              <tr v-if="!stats?.recentArticles?.length"><td colspan="3" class="text-center text-ink-muted">暂无文章</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-card">
        <div class="flex items-center justify-between border-b border-line pb-4">
          <h3 class="cn-title text-base">最近商品</h3>
          <NuxtLink to="/admin/products" class="text-xs text-cinnabar">管理 →</NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="admin-table !min-w-0">
            <thead><tr><th>名称</th><th class="w-20">状态</th><th class="w-24 text-right">价格</th></tr></thead>
            <tbody>
              <tr v-for="item in (stats?.recentProducts || [])" :key="item.id">
                <td class="max-w-[240px] truncate text-ink">{{ item.name }}</td>
                <td><span class="admin-tag" :class="item.status === 'ON_SALE' ? 'text-jade' : 'text-ink-muted'">{{ STATUS_TEXT[item.status] || item.status }}</span></td>
                <td class="text-right text-cinnabar">{{ formatPrice(item.price) }}</td>
              </tr>
              <tr v-if="!stats?.recentProducts?.length"><td colspan="3" class="text-center text-ink-muted">暂无商品</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="admin-card mt-6">
      <h3 class="cn-title border-b border-line pb-4 text-base">快捷操作</h3>
      <div class="mt-5 flex flex-wrap gap-3">
        <NuxtLink to="/admin/articles?new=1" class="admin-btn-primary">写新文章</NuxtLink>
        <NuxtLink to="/admin/products/save" class="admin-btn-primary">上新器物</NuxtLink>
        <NuxtLink to="/admin/banners" class="admin-btn">更新首页轮播</NuxtLink>
        <NuxtLink to="/admin/settings" class="admin-btn">修改网站信息</NuxtLink>
        <NuxtLink to="/admin/media" class="admin-btn">上传图片素材</NuxtLink>
      </div>
      <p class="mt-5 text-xs text-ink-muted">累计文章阅读 {{ stats?.totalViews ?? 0 }} 次</p>
    </section>
  </div>
</template>
