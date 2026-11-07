<script setup>
/**
 * 单图选择器
 * 支持：七牛云直传 / 外链或七牛 key 手动填写 / 清除
 * 上传前自动压缩为 WebP，可勾选「上传原图」保留原始画质。
 * v-model 绑定字符串（URL 或七牛 key）
 */
import { Popup, Button, showToast } from 'vant'
import { compressionSummary } from '../../utils/image-compress.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  folder: { type: String, default: 'images' },
  label: { type: String, default: '图片' },
  ratio: { type: String, default: '16 / 9' }
})
const emit = defineEmits(['update:modelValue'])

const { upload, uploading, compressing, progress, lastCompression } = useQiniuUpload()
const fileInput = ref(null)
const manualOpen = ref(false)
const manualValue = ref('')
const keepOriginal = ref(false)

async function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const url = await upload(file, props.folder, { compress: !keepOriginal.value })
    emit('update:modelValue', url)
    const info = lastCompression.value
    showToast(info && !info.skipped ? `上传成功 · 体积减少 ${info.savedRatio}%` : '上传成功')
  } catch (error) {
    showToast(error.message || '上传失败')
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function openManual() {
  manualValue.value = props.modelValue || ''
  manualOpen.value = true
}

function applyManual() {
  emit('update:modelValue', manualValue.value.trim())
  manualOpen.value = false
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="admin-label !mb-0">{{ label }}</span>
      <span v-if="compressing || uploading" class="text-xs text-cinnabar">{{ compressing ? '压缩中…' : `上传中 ${progress}%` }}</span>
    </div>
    <div class="mt-2 border border-line bg-white">
      <SiteMediaImage :src="modelValue" :alt="label" :ratio="ratio" sizes="(max-width: 640px) 100vw, 33vw" class="max-h-64" />
      <div class="flex flex-wrap items-center gap-2 border-t border-line p-2">
        <Button size="small" class="!border-line !bg-white" :loading="uploading || compressing" @click="fileInput?.click()">上传图片</Button>
        <Button size="small" class="!border-line !bg-white" @click="openManual">填写地址</Button>
        <Button v-if="modelValue" size="small" class="!border-line !bg-white !text-cinnabar" @click="emit('update:modelValue', '')">清除</Button>
        <label class="ml-auto flex cursor-pointer items-center gap-1 text-[11px] text-ink-muted">
          <input v-model="keepOriginal" type="checkbox" class="h-3 w-3 accent-cinnabar" /> 原图
        </label>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    <p class="mt-1.5 text-[11px] leading-5 text-ink-muted">
      默认在浏览器内压缩为 WebP（长边 ≤ 1920px），减少上传流量与存储；需高清大图可勾选「原图」。也可填写外链或站内路径。
    </p>
    <p v-if="lastCompression" class="mt-1 text-[11px] text-jade">{{ compressionSummary(lastCompression) }}</p>

    <Popup v-model:show="manualOpen" position="bottom" round :style="{ padding: '20px' }">
      <h3 class="cn-title mb-3 text-base">填写图片地址</h3>
      <input v-model="manualValue" class="admin-input" placeholder="https://... 或 /images/demo/1.svg 或 七牛 key" />
      <div class="mt-4 flex gap-2">
        <Button block class="!border-line !bg-white" @click="manualOpen = false">取消</Button>
        <Button block class="!border-cinnabar !bg-cinnabar !text-white" @click="applyManual">确定</Button>
      </div>
    </Popup>
  </div>
</template>
