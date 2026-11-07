<script setup>
/**
 * 多图管理（商品轮播图 / 详情图）
 * v-model: [{ url, alt, kind, sortOrder }]
 * 支持七牛云批量直传（逐张压缩）、手动地址、上下移动（排序）、删除。
 */
import { Button, Popup, showToast } from 'vant'
import { formatBytes } from '../../utils/image-compress.js'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  folder: { type: String, default: 'products' },
  kind: { type: String, default: 'CAROUSEL' },
  label: { type: String, default: '轮播图' }
})
const emit = defineEmits(['update:modelValue'])

const { upload, uploading, compressing, progress, lastCompression } = useQiniuUpload()
const fileInput = ref(null)
const manualOpen = ref(false)
const manualValue = ref('')
const editingAlt = ref(-1)
const keepOriginal = ref(false)
const lastBatch = ref(null)

const list = computed(() => props.modelValue || [])

function commit(next) {
  emit('update:modelValue', next.map((item, index) => ({ ...item, kind: props.kind, sortOrder: index })))
}

async function onFiles(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  const next = [...list.value]
  const stat = { count: 0, originalSize: 0, size: 0, compressed: 0 }
  for (const file of files) {
    try {
      const url = await upload(file, props.folder, { compress: !keepOriginal.value })
      next.push({ url, alt: file.name, kind: props.kind, sortOrder: next.length })
      const info = lastCompression.value
      if (info) {
        stat.count++
        stat.originalSize += info.originalSize
        stat.size += info.size
        if (!info.skipped) stat.compressed++
      }
    } catch (error) {
      showToast(error.message || '上传失败')
    }
  }
  commit(next)
  lastBatch.value = stat.count ? stat : null
  const saved = stat.originalSize ? Math.round((1 - stat.size / stat.originalSize) * 100) : 0
  showToast(stat.compressed ? `已上传 ${stat.count} 张 · 体积减少 ${saved}%` : `已上传 ${stat.count} 张`)
  if (fileInput.value) fileInput.value.value = ''
}

function addManual() {
  const url = manualValue.value.trim()
  if (!url) return
  commit([...list.value, { url, alt: '', kind: props.kind, sortOrder: list.value.length }])
  manualValue.value = ''
  manualOpen.value = false
}

function remove(index) {
  commit(list.value.filter((_, i) => i !== index))
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= list.value.length) return
  const next = [...list.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  commit(next)
}

function updateAlt(index, value) {
  const next = list.value.map((item, i) => (i === index ? { ...item, alt: value } : item))
  emit('update:modelValue', next)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="admin-label !mb-0">{{ label }}（{{ list.length }}）</span>
      <span v-if="compressing || uploading" class="text-xs text-cinnabar">{{ compressing ? '压缩中…' : `上传中 ${progress}%` }}</span>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="(item, index) in list" :key="`${item.url}-${index}`" class="border border-line bg-white">
        <SiteMediaImage :src="item.url" :alt="item.alt || label" ratio="1 / 1" sizes="(max-width: 640px) 50vw, 20vw" />
        <div class="border-t border-line p-2">
          <input
            v-if="editingAlt === index"
            :value="item.alt"
            class="admin-input !px-2 !py-1 !text-xs"
            placeholder="图片说明"
            @blur="editingAlt = -1; updateAlt(index, $event.target.value)"
            @keyup.enter="editingAlt = -1"
          />
          <div v-else class="flex items-center justify-between gap-1">
            <button class="min-w-0 flex-1 truncate text-left text-[11px] text-ink-muted" @click="editingAlt = index">{{ item.alt || '添加说明' }}</button>
            <div class="flex shrink-0 gap-1">
              <button class="px-1 text-xs text-ink-muted hover:text-cinnabar" title="前移" @click="move(index, -1)">↑</button>
              <button class="px-1 text-xs text-ink-muted hover:text-cinnabar" title="后移" @click="move(index, 1)">↓</button>
              <button class="px-1 text-xs text-cinnabar" title="删除" @click="remove(index)">×</button>
            </div>
          </div>
        </div>
      </div>

      <button class="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/30 text-ink-muted transition-colors hover:border-cinnabar hover:text-cinnabar" @click="fileInput?.click()">
        <span class="text-3xl">＋</span>
        <span class="text-xs tracking-widest">上传图片</span>
      </button>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <Button size="small" class="!border-line !bg-white" @click="manualOpen = true">添加图片地址</Button>
      <label class="flex cursor-pointer items-center gap-1 text-[11px] text-ink-muted">
        <input v-model="keepOriginal" type="checkbox" class="h-3 w-3 accent-cinnabar" /> 原图上传
      </label>
      <span class="text-[11px] text-ink-muted">批量上传逐张压缩为 WebP；↑↓ 调整顺序</span>
    </div>
    <p v-if="lastBatch" class="mt-1.5 text-[11px] text-jade">
      本次 {{ lastBatch.count }} 张：{{ formatBytes(lastBatch.originalSize) }} → {{ formatBytes(lastBatch.size) }}，已压缩 {{ lastBatch.compressed }} 张
    </p>
    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFiles" />

    <Popup v-model:show="manualOpen" position="bottom" round :style="{ padding: '20px' }">
      <h3 class="cn-title mb-3 text-base">添加图片地址</h3>
      <input v-model="manualValue" class="admin-input" placeholder="https://... 或 /images/demo/1.svg 或 七牛 key" />
      <div class="mt-4 flex gap-2">
        <Button block class="!border-line !bg-white" @click="manualOpen = false">取消</Button>
        <Button block class="!border-cinnabar !bg-cinnabar !text-white" @click="addManual">添加</Button>
      </div>
    </Popup>
  </div>
</template>
