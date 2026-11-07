<script setup>
import { Button, showConfirmDialog, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const { get, del, put } = useApi()
const keyword = ref('')
const status = ref('')
const page = ref(1)

const { data: result, refresh, pending } = await useAsyncData(
  'admin-product-list',
  () => get('/api/admin/products', { page: page.value, pageSize: 10, keyword: keyword.value, status: status.value }),
  { watch: [page, status] }
)

async function remove(item) {
  try { await showConfirmDialog({ title: '删除商品', message: `确定删除「${item.name}」及其全部图片？` }) } catch { return }
  try {
    await del(`/api/admin/products/${item.id}`)
    showToast('已删除')
    refresh()
  } catch (error) { showToast(error.message || '删除失败') }
}

async function toggleStatus(item) {
  try {
    await put(`/api/admin/products/${item.id}`, { status: item.status === 'ON_SALE' ? 'OFF_SHELF' : 'ON_SALE' })
    showToast('状态已更新')
    refresh()
  } catch (error) { showToast(error.message || '操作失败') }
}

useHead({ title: '商品管理' })
</script>

<template>
  <div>
    <AdminPageHeader title="商品管理" description="轮播图、品种、类型、规格，一处维护">
      <template #actions>
        <NuxtLink to="/admin/categories" class="admin-btn">分类与类型</NuxtLink>
        <NuxtLink to="/admin/products/save" class="admin-btn-primary">＋ 上新器物</NuxtLink>
      </template>
    </AdminPageHeader>

    <section class="admin-card !p-4">
      <div class="flex flex-wrap gap-3">
        <input v-model="keyword" class="admin-input !w-auto min-w-[200px] flex-1" placeholder="搜索商品名称 / 副标题" @keyup.enter="() => { page = 1; refresh() }" />
        <select v-model="status" class="admin-select !w-auto" @change="() => { page = 1; refresh() }">
          <option value="">全部状态</option><option value="ON_SALE">在售</option><option value="OFF_SHELF">已下架</option>
        </select>
        <button class="admin-btn" @click="() => { page = 1; refresh() }">搜索</button>
      </div>
    </section>

    <section class="admin-card mt-5 !p-0">
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="w-20">封面</th><th>商品</th><th class="w-24">品种</th><th class="w-24">类型</th>
              <th class="w-28">价格</th><th class="w-20">库存</th><th class="w-24">状态</th><th class="w-40 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in (result?.list || [])" :key="item.id">
              <td><SiteMediaImage :src="item.coverImage" :alt="item.name" ratio="1 / 1" sizes="48px" :widths="[64, 128]" class="!w-12" /></td>
              <td class="max-w-[260px]">
                <p class="truncate font-medium text-ink">{{ item.name }}</p>
                <p class="mt-1 truncate text-xs text-ink-muted">{{ item.subtitle || item.summary }} · {{ item.images?.length || 0 }} 张图</p>
              </td>
              <td>{{ item.category?.name || '—' }}</td>
              <td>{{ item.type?.name || '—' }}</td>
              <td class="text-cinnabar">{{ formatPrice(item.price) }}</td>
              <td>{{ item.stock }}</td>
              <td><span class="admin-tag" :class="item.status === 'ON_SALE' ? 'text-jade' : 'text-ink-muted'">{{ STATUS_TEXT[item.status] }}</span></td>
              <td class="text-right">
                <NuxtLink :to="`/admin/products/save?id=${item.id}`" class="text-xs text-ink-soft hover:text-cinnabar">编辑</NuxtLink>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-gold" @click="toggleStatus(item)">{{ item.status === 'ON_SALE' ? '下架' : '上架' }}</button>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-cinnabar" @click="remove(item)">删除</button>
              </td>
            </tr>
            <tr v-if="!pending && !result?.list?.length"><td colspan="8" class="py-10 text-center text-ink-muted">暂无商品，点击右上角上新</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-5"><AdminPagination :page="page" :total-pages="result?.totalPages || 1" :total="result?.total || 0" @change="(p) => (page = p)" /></div>
    </section>
  </div>
</template>
