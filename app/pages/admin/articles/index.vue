<script setup>
import { Popup, Button, Switch, showConfirmDialog, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const { get, post, put, del } = useApi()

const keyword = ref('')
const status = ref('')
const page = ref(1)
const drawerOpen = ref(false)
const saving = ref(false)
const editingId = ref('')
const preview = ref(false)

const { data: categories } = await useAsyncData('admin-article-categories', () => get('/api/admin/taxonomy/article-categories'))
const { data: result, refresh, pending } = await useAsyncData(
  'admin-article-list',
  () => get('/api/admin/articles', { page: page.value, pageSize: 10, keyword: keyword.value, status: status.value }),
  { watch: [page, status] }
)

function emptyForm() {
  return {
    title: '', slug: '', categoryId: '', summary: '', content: '', coverImage: '',
    author: '云涧编辑部', tags: '', isTop: false, status: 'PUBLISHED',
    seoTitle: '', seoDescription: ''
  }
}
const form = reactive(emptyForm())

function openCreate() {
  editingId.value = ''
  Object.assign(form, emptyForm())
  preview.value = false
  drawerOpen.value = true
}

function openEdit(item) {
  editingId.value = item.id
  Object.assign(form, {
    title: item.title || '', slug: item.slug || '', categoryId: item.categoryId || '',
    summary: item.summary || '', content: item.content || '', coverImage: item.coverImage || '',
    author: item.author || '云涧编辑部', tags: Array.isArray(item.tags) ? item.tags.join('，') : (item.tags || ''),
    isTop: Boolean(item.isTop), status: item.status || 'DRAFT',
    seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || ''
  })
  preview.value = false
  drawerOpen.value = true
}

function payload() {
  return {
    ...form,
    tags: String(form.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    slug: form.slug || undefined
  }
}

async function save() {
  if (!form.title.trim()) return showToast('请填写文章标题')
  saving.value = true
  try {
    if (editingId.value) await put(`/api/admin/articles/${editingId.value}`, payload())
    else await post('/api/admin/articles', payload())
    showToast(editingId.value ? '已更新' : '文章已创建')
    drawerOpen.value = false
    await refresh()
  } catch (error) {
    showToast(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function remove(item) {
  try { await showConfirmDialog({ title: '删除文章', message: `确定删除「${item.title}」？此操作不可撤销。` }) } catch { return }
  try {
    await del(`/api/admin/articles/${item.id}`)
    showToast('已删除')
    await refresh()
  } catch (error) { showToast(error.message || '删除失败') }
}

function onSearch() { page.value = 1; refresh() }
function onStatusChange() { page.value = 1; refresh() }

onMounted(() => {
  if (route.query.new === '1') {
    openCreate()
    router.replace('/admin/articles')
  }
})

useHead({ title: '文章管理' })
</script>

<template>
  <div>
    <AdminPageHeader title="文章管理" description="写下器物、茶事与生活里的慢时光">
      <template #actions>
        <button class="admin-btn-primary" @click="openCreate">＋ 写新文章</button>
      </template>
    </AdminPageHeader>

    <section class="admin-card !p-4">
      <div class="flex flex-wrap gap-3">
        <input v-model="keyword" class="admin-input !w-auto min-w-[200px] flex-1" placeholder="搜索文章标题 / 摘要" @keyup.enter="onSearch" />
        <select v-model="status" class="admin-select !w-auto" @change="onStatusChange">
          <option value="">全部状态</option>
          <option value="PUBLISHED">已发布</option>
          <option value="DRAFT">草稿</option>
        </select>
        <button class="admin-btn" @click="onSearch">搜索</button>
      </div>
    </section>

    <section class="admin-card mt-5 !p-0">
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="w-20">封面</th><th>标题</th><th class="w-28">分类</th>
              <th class="w-24">状态</th><th class="w-28">更新时间</th><th class="w-40 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in (result?.list || [])" :key="item.id">
              <td><SiteMediaImage :src="item.coverImage" :alt="item.title" ratio="1 / 1" sizes="48px" :widths="[64, 128]" class="!w-12" /></td>
              <td class="max-w-[280px]">
                <p class="truncate font-medium text-ink">{{ item.title }}</p>
                <p class="mt-1 truncate text-xs text-ink-muted">/{{ item.slug }} · {{ item.viewCount || 0 }} 次阅读</p>
              </td>
              <td>{{ item.category?.name || '—' }}</td>
              <td><span class="admin-tag" :class="item.status === 'PUBLISHED' ? 'text-jade' : 'text-ink-muted'">{{ STATUS_TEXT[item.status] }}</span><span v-if="item.isTop" class="ml-1 text-xs text-cinnabar">置顶</span></td>
              <td class="text-xs">{{ formatDate(item.updatedAt) }}</td>
              <td class="text-right">
                <button class="text-xs text-ink-soft hover:text-cinnabar" @click="openEdit(item)">编辑</button>
                <span class="mx-2 text-line">|</span>
                <button class="text-xs text-cinnabar" @click="remove(item)">删除</button>
              </td>
            </tr>
            <tr v-if="!pending && !result?.list?.length"><td colspan="6" class="py-10 text-center text-ink-muted">暂无文章，点击右上角开始写作</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-5"><AdminPagination :page="page" :total-pages="result?.totalPages || 1" :total="result?.total || 0" @change="(p) => (page = p)" /></div>
    </section>

    <!-- 编辑抽屉 -->
    <Popup v-model:show="drawerOpen" position="right" :style="{ width: 'min(720px, 100%)', height: '100%' }">
      <div class="flex h-full flex-col bg-paper">
        <div class="flex items-center justify-between border-b border-line bg-paper-card px-5 py-4">
          <h3 class="cn-title text-lg">{{ editingId ? '编辑文章' : '写新文章' }}</h3>
          <button class="text-2xl text-ink-muted" @click="drawerOpen = false">×</button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto p-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label class="admin-label">标题 *</label><input v-model="form.title" class="admin-input" placeholder="例如：青瓷一盏，藏一整个江南的雨" /></div>
            <div><label class="admin-label">URL 别名（slug）</label><input v-model="form.slug" class="admin-input" placeholder="留空自动生成" /></div>
            <div>
              <label class="admin-label">分类</label>
              <select v-model="form.categoryId" class="admin-select"><option value="">未分类</option><option v-for="c in (categories || [])" :key="c.id" :value="c.id">{{ c.name }}</option></select>
            </div>
            <div><label class="admin-label">作者</label><input v-model="form.author" class="admin-input" /></div>
            <div><label class="admin-label">标签（逗号分隔）</label><input v-model="form.tags" class="admin-input" placeholder="青瓷，器物，匠人" /></div>
            <div class="sm:col-span-2"><label class="admin-label">摘要</label><textarea v-model="form.summary" class="admin-input" rows="2" placeholder="一两句话，出现在列表与分享摘要中" /></div>
          </div>

          <AdminImagePicker v-model="form.coverImage" label="封面图" folder="articles" />

          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="admin-label !mb-0">正文（支持 Markdown）</label>
              <button class="text-xs text-cinnabar" @click="preview = !preview">{{ preview ? '继续编辑' : '预览效果' }}</button>
            </div>
            <textarea v-if="!preview" v-model="form.content" class="admin-input font-mono !text-[13px] leading-7" rows="14" placeholder="## 小标题&#10;&#10;正文内容，支持 **加粗**、> 引用、- 列表" />
            <div v-else class="prose-cn min-h-[300px] border border-line bg-white p-5" v-html="renderMarkdown(form.content)" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label">发布状态</label>
              <select v-model="form.status" class="admin-select"><option value="PUBLISHED">立即发布</option><option value="DRAFT">存为草稿</option></select>
            </div>
            <div class="flex items-end pb-2">
              <label class="flex items-center gap-3 text-sm text-ink-soft"><Switch v-model="form.isTop" size="20px" /> 设为置顶</label>
            </div>
            <div class="sm:col-span-2"><label class="admin-label">SEO 标题</label><input v-model="form.seoTitle" class="admin-input" placeholder="留空则使用文章标题" /></div>
            <div class="sm:col-span-2"><label class="admin-label">SEO 描述</label><textarea v-model="form.seoDescription" class="admin-input" rows="2" /></div>
          </div>
        </div>

        <div class="flex gap-3 border-t border-line bg-paper-card px-5 py-4">
          <Button block class="!border-line !bg-white" @click="drawerOpen = false">取消</Button>
          <Button block :loading="saving" class="!border-cinnabar !bg-cinnabar !text-white" @click="save">保存文章</Button>
        </div>
      </div>
    </Popup>
  </div>
</template>
