<script setup>
import { Button, Switch, showToast } from 'vant'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const { get, post, put } = useApi()
const id = computed(() => String(route.query.id || ''))
const isEdit = computed(() => Boolean(id.value))
const saving = ref(false)

const { data: categories } = await useAsyncData('admin-product-categories', () => get('/api/admin/taxonomy/product-categories'))
const { data: types } = await useAsyncData('admin-product-types', () => get('/api/admin/taxonomy/product-types'))
const { data: existing } = await useAsyncData('admin-product-edit', () => (id.value ? get(`/api/admin/products/${id.value}`) : Promise.resolve(null)), { watch: [id] })

function emptyForm() {
  return {
    name: '', slug: '', subtitle: '', summary: '', description: '', coverImage: '',
    price: 0, originalPrice: '', stock: 0, unit: '件', status: 'ON_SALE',
    isFeatured: false, isRecommend: false, sortOrder: 0,
    categoryId: '', typeId: '', origin: '', material: '', craft: '', packageInfo: '',
    tags: '', seoTitle: '', seoDescription: '',
    specs: [], images: [], detailImages: []
  }
}

const form = reactive(emptyForm())

function fill(data) {
  if (!data) return
  Object.assign(form, {
    ...emptyForm(),
    name: data.name || '', slug: data.slug || '', subtitle: data.subtitle || '',
    summary: data.summary || '', description: data.description || '', coverImage: data.coverImage || '',
    price: Number(data.price) || 0, originalPrice: data.originalPrice ? Number(data.originalPrice) : '',
    stock: data.stock || 0, unit: data.unit || '件', status: data.status || 'ON_SALE',
    isFeatured: Boolean(data.isFeatured), isRecommend: Boolean(data.isRecommend), sortOrder: data.sortOrder || 0,
    categoryId: data.categoryId || '', typeId: data.typeId || '',
    origin: data.origin || '', material: data.material || '', craft: data.craft || '', packageInfo: data.packageInfo || '',
    tags: Array.isArray(data.tags) ? data.tags.join('，') : (data.tags || ''),
    seoTitle: data.seoTitle || '', seoDescription: data.seoDescription || '',
    specs: Array.isArray(data.specs) ? data.specs.map((item) => ({ ...item })) : [],
    images: (data.images || []).filter((item) => item.kind !== 'DETAIL').map(({ url, alt, kind, sortOrder }) => ({ url, alt, kind, sortOrder })),
    detailImages: (data.images || []).filter((item) => item.kind === 'DETAIL').map(({ url, alt, kind, sortOrder }) => ({ url, alt, kind, sortOrder }))
  })
  if (!form.coverImage && form.images.length) form.coverImage = form.images[0].url
}

watch(existing, fill, { immediate: true })

function addSpec() { form.specs.push({ name: '', value: '' }) }
function removeSpec(index) { form.specs.splice(index, 1) }

function payload() {
  return {
    ...form,
    tags: String(form.tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    slug: form.slug || undefined,
    specs: form.specs.filter((item) => item.name || item.value),
    coverImage: form.coverImage || form.images?.[0]?.url || ''
  }
}

async function save() {
  if (!form.name.trim()) return showToast('请填写商品名称')
  saving.value = true
  try {
    if (isEdit.value) await put(`/api/admin/products/${id.value}`, payload())
    else await post('/api/admin/products', payload())
    showToast('保存成功')
    router.push('/admin/products')
  } catch (error) {
    showToast(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

useHead({ title: '编辑商品' })
</script>

<template>
  <div>
    <AdminPageHeader :title="isEdit ? '编辑器物' : '上新器物'" description="按区块填写，保存后立即同步到前台">
      <template #actions>
        <NuxtLink to="/admin/products" class="admin-btn">返回列表</NuxtLink>
        <button class="admin-btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存商品' }}</button>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 xl:grid-cols-3">
      <div class="space-y-5 xl:col-span-2">
        <!-- 基本信息 -->
        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">基本信息</h3>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label class="admin-label">商品名称 *</label><input v-model="form.name" class="admin-input" placeholder="例如：雨过天青 · 青瓷品茗杯" /></div>
            <div><label class="admin-label">URL 别名（slug）</label><input v-model="form.slug" class="admin-input" placeholder="留空自动生成" /></div>
            <div><label class="admin-label">副标题</label><input v-model="form.subtitle" class="admin-input" placeholder="龙泉手工 · 单杯" /></div>
            <div class="sm:col-span-2"><label class="admin-label">商品简介</label><textarea v-model="form.summary" class="admin-input" rows="2" placeholder="一句话说明，展示在列表与详情页" /></div>
            <div class="sm:col-span-2"><label class="admin-label">标签（逗号分隔）</label><input v-model="form.tags" class="admin-input" placeholder="青瓷，茶器" /></div>
            <div class="sm:col-span-2">
              <label class="admin-label">详情正文（Markdown）</label>
              <textarea v-model="form.description" class="admin-input font-mono !text-[13px] leading-7" rows="8" placeholder="## 关于这件器物&#10;&#10;讲述材质、工艺与养护…" />
            </div>
          </div>
        </section>

        <!-- 图片管理 -->
        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">图片管理</h3>
          <div class="mt-5"><AdminImagePicker v-model="form.coverImage" label="商品封面图" folder="products" ratio="1 / 1" /></div>
          <div class="mt-7 border-t border-line pt-6"><AdminImageGallery v-model="form.images" label="商品轮播图" folder="products/carousel" kind="CAROUSEL" /></div>
          <div class="mt-7 border-t border-line pt-6"><AdminImageGallery v-model="form.detailImages" label="详情长图" folder="products/detail" kind="DETAIL" /></div>
        </section>

        <!-- 规格参数 -->
        <section class="admin-card">
          <div class="flex items-center justify-between border-b border-line pb-3">
            <h3 class="cn-title text-base">规格参数</h3>
            <button class="admin-btn !px-3 !py-1.5" @click="addSpec">＋ 添加一项</button>
          </div>
          <div class="mt-4 space-y-2">
            <div v-for="(item, index) in form.specs" :key="index" class="flex gap-2">
              <input v-model="item.name" class="admin-input !w-1/3" placeholder="参数名，如 容量" />
              <input v-model="item.value" class="admin-input flex-1" placeholder="参数值，如 85ml" />
              <button class="admin-btn-danger !px-3" @click="removeSpec(index)">删除</button>
            </div>
            <p v-if="!form.specs.length" class="py-4 text-center text-xs text-ink-muted">暂无规格，可添加容量、尺寸、材质等</p>
          </div>
        </section>
      </div>

      <!-- 右侧设置 -->
      <div class="space-y-5">
        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">价格与库存</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label class="admin-label">售价（¥）*</label><input v-model.number="form.price" type="number" min="0" step="0.01" class="admin-input" /></div>
            <div><label class="admin-label">划线原价</label><input v-model="form.originalPrice" type="number" min="0" step="0.01" class="admin-input" placeholder="留空不显示" /></div>
            <div><label class="admin-label">库存</label><input v-model.number="form.stock" type="number" min="0" class="admin-input" /></div>
            <div><label class="admin-label">单位</label><input v-model="form.unit" class="admin-input" /></div>
            <div class="sm:col-span-2"><label class="admin-label">排序值（越小越靠前）</label><input v-model.number="form.sortOrder" type="number" class="admin-input" /></div>
          </div>
        </section>

        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">分类与展示</h3>
          <div class="mt-4 space-y-4">
            <div>
              <label class="admin-label">品种</label>
              <select v-model="form.categoryId" class="admin-select">
                <option value="">未分类</option>
                <option v-for="c in (categories || [])" :key="c.id" :value="c.id">{{ c.parentId ? '　└ ' : '' }}{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="admin-label">类型</label>
              <select v-model="form.typeId" class="admin-select">
                <option value="">无</option>
                <option v-for="t in (types || [])" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div><label class="admin-label">上架状态</label><select v-model="form.status" class="admin-select"><option value="ON_SALE">在售</option><option value="OFF_SHELF">已下架</option></select></div>
            <div class="flex flex-wrap gap-5 pt-1">
              <label class="flex items-center gap-2 text-sm text-ink-soft"><Switch v-model="form.isFeatured" size="20px" /> 首页精选</label>
              <label class="flex items-center gap-2 text-sm text-ink-soft"><Switch v-model="form.isRecommend" size="20px" /> 推荐</label>
            </div>
          </div>
        </section>

        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">器物属性</h3>
          <div class="mt-4 space-y-3">
            <div><label class="admin-label">产地</label><input v-model="form.origin" class="admin-input" placeholder="浙江龙泉" /></div>
            <div><label class="admin-label">材质</label><input v-model="form.material" class="admin-input" placeholder="高岭土 · 青釉" /></div>
            <div><label class="admin-label">工艺</label><input v-model="form.craft" class="admin-input" placeholder="柴窑还原烧" /></div>
            <div><label class="admin-label">包装</label><input v-model="form.packageInfo" class="admin-input" placeholder="桐木礼盒" /></div>
          </div>
        </section>

        <section class="admin-card">
          <h3 class="cn-title border-b border-line pb-3 text-base">SEO</h3>
          <div class="mt-4 space-y-3">
            <div><label class="admin-label">SEO 标题</label><input v-model="form.seoTitle" class="admin-input" /></div>
            <div><label class="admin-label">SEO 描述</label><textarea v-model="form.seoDescription" class="admin-input" rows="2" /></div>
          </div>
        </section>

        <Button block :loading="saving" class="!h-12 !border-cinnabar !bg-cinnabar !text-sm !tracking-[0.3em] !text-white" @click="save">保存商品</Button>
      </div>
    </div>
  </div>
</template>
