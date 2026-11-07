<script setup>
import { Button, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const { get, put } = useApi()
const { data: settings, refresh } = await useAsyncData('admin-settings', () => get('/api/admin/settings'))
const form = reactive({})
const saving = ref(false)

const groups = [
  { key: 'basic', title: '基本信息', desc: '站点名称、标语与简介' },
  { key: 'home', title: '首页文案', desc: '首屏主标题、副标题与题句' },
  { key: 'about', title: '品牌故事', desc: '关于页与首页 CTA 共用的叙述' },
  { key: 'seo', title: 'SEO 设置', desc: '搜索引擎关键词' },
  { key: 'contact', title: '联系与页脚', desc: '电话、邮箱、地址、备案信息' }
]

watch(settings, (rows) => {
  if (!Array.isArray(rows)) return
  rows.forEach((row) => { form[row.key] = row.value })
}, { immediate: true })

const byGroup = computed(() => Object.fromEntries(groups.map((group) => [
  group.key,
  (settings.value || []).filter((item) => item.group === group.key).sort((a, b) => a.sortOrder - b.sortOrder)
])))

async function save() {
  saving.value = true
  try {
    const items = (settings.value || []).map((item) => ({ ...item, value: form[item.key] ?? '' }))
    await put('/api/admin/settings', { items })
    showToast('网站信息已更新')
    await refresh()
  } catch (error) { showToast(error.message || '保存失败') }
  finally { saving.value = false }
}

useHead({ title: '网站信息' })
</script>

<template>
  <div>
    <AdminPageHeader title="网站信息" description="前台所有文案与联系方式，集中在此维护">
      <template #actions>
        <button class="admin-btn" @click="refresh">重新载入</button>
        <button class="admin-btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存全部' }}</button>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 xl:grid-cols-2">
      <section v-for="group in groups" :key="group.key" class="admin-card">
        <div class="border-b border-line pb-3">
          <h3 class="cn-title text-base">{{ group.title }}</h3>
          <p class="mt-1 text-xs text-ink-muted">{{ group.desc }}</p>
        </div>
        <div class="mt-4 space-y-4">
          <div v-for="item in (byGroup[group.key] || [])" :key="item.key">
            <label class="admin-label">{{ item.label }} <span class="ml-1 text-[10px] text-ink-muted/70">({{ item.key }})</span></label>
            <AdminImagePicker v-if="item.type === 'image'" v-model="form[item.key]" :label="item.label" folder="site" ratio="1 / 1" />
            <textarea v-else-if="item.type === 'textarea'" v-model="form[item.key]" class="admin-input" rows="4" />
            <input v-else v-model="form[item.key]" class="admin-input" />
          </div>
          <p v-if="!byGroup[group.key]?.length" class="text-xs text-ink-muted">该分组暂无配置项</p>
        </div>
      </section>
    </div>

    <div class="mt-6 flex justify-end">
      <Button :loading="saving" class="!h-11 !border-cinnabar !bg-cinnabar !px-10 !text-sm !tracking-[0.3em] !text-white" @click="save">保存全部设置</Button>
    </div>
  </div>
</template>
