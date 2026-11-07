<script setup>
import { Popup, Button, Switch, showConfirmDialog, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const { get, post, put, del } = useApi()
const { data: list, refresh } = await useAsyncData('admin-banner-list', () => get('/api/admin/banners'))
const drawerOpen = ref(false)
const saving = ref(false)
const editingId = ref('')

function emptyForm() {
  return { title: '', subtitle: '', image: '', link: '', position: 'HOME', status: 'ENABLED', sortOrder: 0 }
}
const form = reactive(emptyForm())

function openCreate() {
  editingId.value = ''
  Object.assign(form, emptyForm())
  drawerOpen.value = true
}
function openEdit(item) {
  editingId.value = item.id
  Object.assign(form, {
    title: item.title || '', subtitle: item.subtitle || '', image: item.image || '',
    link: item.link || '', position: item.position || 'HOME',
    status: item.status || 'ENABLED', sortOrder: item.sortOrder || 0
  })
  drawerOpen.value = true
}

async function save() {
  if (!form.title.trim() || !form.image.trim()) return showToast('请填写标题并上传图片')
  saving.value = true
  try {
    if (editingId.value) await put(`/api/admin/banners/${editingId.value}`, form)
    else await post('/api/admin/banners', form)
    showToast('已保存')
    drawerOpen.value = false
    await refresh()
  } catch (error) { showToast(error.message || '保存失败') }
  finally { saving.value = false }
}

async function remove(item) {
  try { await showConfirmDialog({ title: '删除轮播', message: `确定删除「${item.title}」？` }) } catch { return }
  try {
    await del(`/api/admin/banners/${item.id}`)
    showToast('已删除')
    await refresh()
  } catch (error) { showToast(error.message || '删除失败') }
}

async function toggle(item) {
  try {
    await put(`/api/admin/banners/${item.id}`, { status: item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' })
    showToast('状态已更新')
    await refresh()
  } catch (error) { showToast(error.message || '操作失败') }
}

useHead({ title: '轮播图管理' })
</script>

<template>
  <div>
    <AdminPageHeader title="轮播图" description="首页首屏展示位，按排序值依次播放">
      <template #actions><button class="admin-btn-primary" @click="openCreate">＋ 新增轮播</button></template>
    </AdminPageHeader>

    <section class="admin-card !p-0">
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead><tr><th class="w-40">图片</th><th>标题 / 副标题</th><th class="w-28">位置</th><th class="w-24">状态</th><th class="w-20">排序</th><th class="w-40 text-right">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in (list || [])" :key="item.id">
              <td><SiteMediaImage :src="item.image" :alt="item.title" ratio="16 / 7" sizes="128px" :widths="[160, 320]" class="!w-32" /></td>
              <td>
                <p class="font-medium text-ink">{{ item.title }}</p>
                <p class="mt-1 text-xs text-ink-muted">{{ item.subtitle }}</p>
                <p class="mt-1 truncate text-xs text-gold">{{ item.link || '无跳转' }}</p>
              </td>
              <td>{{ item.position }}</td>
              <td><span class="admin-tag" :class="item.status === 'ENABLED' ? 'text-jade' : 'text-ink-muted'">{{ STATUS_TEXT[item.status] }}</span></td>
              <td>{{ item.sortOrder }}</td>
              <td class="text-right">
                <button class="text-xs text-ink-soft hover:text-cinnabar" @click="openEdit(item)">编辑</button>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-gold" @click="toggle(item)">{{ item.status === 'ENABLED' ? '停用' : '启用' }}</button>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-cinnabar" @click="remove(item)">删除</button>
              </td>
            </tr>
            <tr v-if="!list?.length"><td colspan="6" class="py-10 text-center text-ink-muted">暂无轮播图</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <Popup v-model:show="drawerOpen" position="right" :style="{ width: 'min(560px, 100%)', height: '100%' }">
      <div class="flex h-full flex-col bg-paper">
        <div class="flex items-center justify-between border-b border-line bg-paper-card px-5 py-4">
          <h3 class="cn-title text-lg">{{ editingId ? '编辑轮播' : '新增轮播' }}</h3>
          <button class="text-2xl text-ink-muted" @click="drawerOpen = false">×</button>
        </div>
        <div class="flex-1 space-y-5 overflow-y-auto p-5">
          <div><label class="admin-label">主标题 *</label><input v-model="form.title" class="admin-input" placeholder="一器一物，自有山河" /></div>
          <div><label class="admin-label">副标题</label><input v-model="form.subtitle" class="admin-input" placeholder="2026 春季新品 · 东方器物志" /></div>
          <AdminImagePicker v-model="form.image" label="轮播图片 *" folder="banners" ratio="16 / 7" />
          <div><label class="admin-label">点击跳转链接</label><input v-model="form.link" class="admin-input" placeholder="/products 或 https://..." /></div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div><label class="admin-label">展示位置</label><input v-model="form.position" class="admin-input" placeholder="HOME" /></div>
            <div><label class="admin-label">排序值</label><input v-model.number="form.sortOrder" type="number" class="admin-input" /></div>
          </div>
          <label class="flex items-center gap-3 text-sm text-ink-soft"><Switch :model-value="form.status === 'ENABLED'" size="20px" @update:model-value="form.status = $event ? 'ENABLED' : 'DISABLED'" /> 启用该轮播</label>
        </div>
        <div class="flex gap-3 border-t border-line bg-paper-card px-5 py-4">
          <Button block class="!border-line !bg-white" @click="drawerOpen = false">取消</Button>
          <Button block :loading="saving" class="!border-cinnabar !bg-cinnabar !text-white" @click="save">保存</Button>
        </div>
      </div>
    </Popup>
  </div>
</template>
