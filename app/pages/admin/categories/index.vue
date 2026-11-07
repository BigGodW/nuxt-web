<script setup>
import { Tabs, Tab, Popup, Button, showConfirmDialog, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const { get, post, put, del } = useApi()
const resources = [
  { key: 'article-categories', label: '文章分类', desc: '用于文章归档与前台筛选' },
  { key: 'product-categories', label: '商品品种', desc: '支持二级结构，例如 茶 > 乌龙茶' },
  { key: 'product-types', label: '商品类型', desc: '独立于品种的维度，例如 手作 / 礼盒' }
]
const active = ref(0)
const current = computed(() => resources[active.value])
const drawerOpen = ref(false)
const saving = ref(false)
const editingId = ref('')

const { data: list, refresh } = await useAsyncData(
  'admin-taxonomy',
  () => get(`/api/admin/taxonomy/${current.value.key}`),
  { watch: [active] }
)

const form = reactive({ name: '', slug: '', description: '', image: '', parentId: '', sortOrder: 0 })

function openCreate() {
  editingId.value = ''
  Object.assign(form, { name: '', slug: '', description: '', image: '', parentId: '', sortOrder: 0 })
  drawerOpen.value = true
}

function openEdit(item) {
  editingId.value = item.id
  Object.assign(form, {
    name: item.name || '', slug: item.slug || '', description: item.description || '',
    image: item.image || '', parentId: item.parentId || '', sortOrder: item.sortOrder || 0
  })
  drawerOpen.value = true
}

const parentOptions = computed(() => (list.value || []).filter((item) => !item.parentId && item.id !== editingId.value))

function payload() {
  const data = { name: form.name, slug: form.slug || undefined, description: form.description, sortOrder: Number(form.sortOrder) || 0 }
  if (current.value.key === 'product-categories') {
    data.image = form.image || ''
    data.parentId = form.parentId || null
  }
  return data
}

async function save() {
  if (!form.name.trim()) return showToast('请填写名称')
  saving.value = true
  try {
    const url = `/api/admin/taxonomy/${current.value.key}${editingId.value ? `/${editingId.value}` : ''}`
    if (editingId.value) await put(url, payload())
    else await post(url, payload())
    showToast('已保存')
    drawerOpen.value = false
    await refresh()
  } catch (error) { showToast(error.message || '保存失败') }
  finally { saving.value = false }
}

async function remove(item) {
  try { await showConfirmDialog({ title: '删除确认', message: `确定删除「${item.name}」？关联内容不会被删除。` }) } catch { return }
  try {
    await del(`/api/admin/taxonomy/${current.value.key}/${item.id}`)
    showToast('已删除')
    await refresh()
  } catch (error) { showToast(error.message || '删除失败') }
}

useHead({ title: '分类与类型' })
</script>

<template>
  <div>
    <AdminPageHeader title="分类与类型" description="三套维度彼此独立，前台筛选与后台录入共用">
      <template #actions><button class="admin-btn-primary" @click="openCreate">＋ 新增{{ current.label }}</button></template>
    </AdminPageHeader>

    <Tabs v-model:active="active" line-width="24px" line-height="2px" title-active-color="#a8322d" color="#4a453d">
      <Tab v-for="item in resources" :key="item.key" :title="item.label">&#8203;</Tab>
    </Tabs>

    <section class="admin-card mt-4 !p-0">
      <div class="border-b border-line px-5 py-3 text-xs text-ink-muted">{{ current.desc }} · 共 {{ list?.length || 0 }} 项</div>
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead><tr><th class="w-16">图</th><th>名称</th><th class="w-36">slug</th><th class="w-40">上级 / 说明</th><th class="w-20">排序</th><th class="w-32 text-right">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in (list || [])" :key="item.id">
              <td><SiteMediaImage v-if="item.image" :src="item.image" :alt="item.name" ratio="1 / 1" sizes="40px" :widths="[64, 128]" class="!w-10" /><span v-else class="text-line">—</span></td>
              <td>
                <span v-if="item.parentId" class="mr-2 text-ink-muted">└</span>
                <span class="text-ink">{{ item.name }}</span>
              </td>
              <td class="text-xs">/{{ item.slug }}</td>
              <td class="text-xs">{{ item.parentId ? (list.find((p) => p.id === item.parentId)?.name || '—') : (item.description || '—') }}</td>
              <td>{{ item.sortOrder }}</td>
              <td class="text-right">
                <button class="text-xs text-ink-soft hover:text-cinnabar" @click="openEdit(item)">编辑</button>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-cinnabar" @click="remove(item)">删除</button>
              </td>
            </tr>
            <tr v-if="!list?.length"><td colspan="6" class="py-10 text-center text-ink-muted">暂无数据，点击右上角新增</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <Popup v-model:show="drawerOpen" position="right" :style="{ width: 'min(520px, 100%)', height: '100%' }">
      <div class="flex h-full flex-col bg-paper">
        <div class="flex items-center justify-between border-b border-line bg-paper-card px-5 py-4">
          <h3 class="cn-title text-lg">{{ editingId ? '编辑' : '新增' }}{{ current.label }}</h3>
          <button class="text-2xl text-ink-muted" @click="drawerOpen = false">×</button>
        </div>
        <div class="flex-1 space-y-5 overflow-y-auto p-5">
          <div><label class="admin-label">名称 *</label><input v-model="form.name" class="admin-input" /></div>
          <div><label class="admin-label">slug（URL 标识）</label><input v-model="form.slug" class="admin-input" placeholder="留空自动生成" /></div>
          <div><label class="admin-label">说明</label><textarea v-model="form.description" class="admin-input" rows="3" /></div>
          <template v-if="current.key === 'product-categories'">
            <AdminImagePicker v-model="form.image" label="分类配图" folder="categories" ratio="3 / 2" />
            <div>
              <label class="admin-label">上级品种（留空为一级）</label>
              <select v-model="form.parentId" class="admin-select"><option value="">一级品种</option><option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            </div>
          </template>
          <div><label class="admin-label">排序值</label><input v-model.number="form.sortOrder" type="number" class="admin-input" /></div>
        </div>
        <div class="flex gap-3 border-t border-line bg-paper-card px-5 py-4">
          <Button block class="!border-line !bg-white" @click="drawerOpen = false">取消</Button>
          <Button block :loading="saving" class="!border-cinnabar !bg-cinnabar !text-white" @click="save">保存</Button>
        </div>
      </div>
    </Popup>
  </div>
</template>
