<script setup>
import { Button, showToast } from 'vant'
import { formatBytes } from '../../../utils/image-compress.js'

definePageMeta({ layout: 'admin' })

const { get } = useApi()
const { data: config, refresh } = await useAsyncData('admin-upload-config', () => get('/api/admin/upload/config'))
const { upload, uploading, compressing, progress, lastCompression } = useQiniuUpload()
const fileInput = ref(null)
const results = ref([])
const folder = ref('common')
const keepOriginal = ref(false)

async function onFileChange(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    try {
      const url = await upload(file, folder.value, { compress: !keepOriginal.value })
      const info = lastCompression.value
      results.value.unshift({
        url,
        name: file.name,
        size: formatBytes(file.size),
        compressedSize: info ? formatBytes(info.size) : formatBytes(file.size),
        savedRatio: info?.skipped ? 0 : info?.savedRatio || 0,
        dimension: info?.width ? `${info.width}×${info.height} ${info.format?.toUpperCase() || ''}` : '',
        reason: info?.reason || ''
      })
      showToast(info && !info.skipped ? `上传成功 · 体积减少 ${info.savedRatio}%` : '上传成功')
    } catch (error) {
      showToast(error.message || '上传失败')
      break
    }
  }
  if (fileInput.value) fileInput.value.value = ''
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('地址已复制')
  } catch { showToast('请手动复制地址') }
}

useHead({ title: '媒体库' })
</script>

<template>
  <div>
    <AdminPageHeader title="媒体库" description="图片统一存放于七牛云对象存储，密钥仅在服务端；上传前自动压缩，前台按需实时转码">
      <template #actions><button class="admin-btn" @click="refresh">刷新状态</button></template>
    </AdminPageHeader>

    <section class="admin-card">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center border border-line bg-paper-deep/50 font-serif-cn text-xl text-gold">云</div>
        <div>
          <h3 class="cn-title text-base">七牛云配置</h3>
          <p class="mt-1 text-xs" :class="config?.ready ? 'text-jade' : 'text-cinnabar'">
            {{ config?.ready ? '已就绪，可直接上传' : '未配置密钥（可先使用外链图片，或在 .env 中补全配置）' }}
          </p>
        </div>
        <span class="ml-auto admin-tag">{{ config?.bucket || '未设置空间' }}</span>
      </div>
      <div class="mt-5 grid gap-3 border-t border-line pt-5 text-xs text-ink-soft sm:grid-cols-3">
        <p>CDN 域名：<span class="text-ink">{{ config?.cdnDomain || '未设置' }}</span></p>
        <p>存储区域：<span class="text-ink">{{ config?.region || 'z0' }}</span></p>
        <p>上传地址：<span class="text-ink">{{ config?.uploadUrl }}</span></p>
      </div>
      <div v-if="!config?.ready" class="mt-5 border border-line bg-paper-deep/40 p-4 text-xs leading-7 text-ink-muted">
        <p class="font-medium text-ink-soft">配置方式（.env）</p>
        <p>NUXT_QINIU_ACCESS_KEY / NUXT_QINIU_SECRET_KEY / NUXT_QINIU_BUCKET</p>
        <p>NUXT_QINIU_CDN_DOMAIN / NUXT_PUBLIC_QINIU_CDN_DOMAIN（供前台拼接图片地址）</p>
        <p>保存后重启开发服务即可生效；未配置时各表单仍可填写外链或站内路径。</p>
      </div>
    </section>

    <section class="admin-card mt-5">
      <h3 class="cn-title border-b border-line pb-3 text-base">上传图片</h3>
      <div class="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label class="admin-label">存储目录</label>
          <input v-model="folder" class="admin-input !w-48" placeholder="common" />
        </div>
        <Button :loading="uploading || compressing" class="!border-cinnabar !bg-cinnabar !text-white" @click="fileInput?.click()">选择图片上传</Button>
        <label class="flex cursor-pointer items-center gap-1.5 pb-2 text-xs text-ink-muted">
          <input v-model="keepOriginal" type="checkbox" class="h-3.5 w-3.5 accent-cinnabar" /> 上传原图（不压缩）
        </label>
        <span v-if="compressing || uploading" class="pb-2 text-xs text-cinnabar">{{ compressing ? '正在压缩图片…' : `上传中 ${progress}%` }}</span>
      </div>
      <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
      <p class="mt-3 text-xs leading-6 text-ink-muted">
        上传前在浏览器内等比缩放至长边 ≤ 1920px 并编码为 WebP（质量 82），从源头减少上传流量与存储；
        SVG / GIF 动图自动跳过，压缩无收益时自动保留原图。上传凭证由服务端签发，单次有效期 1 小时、体积上限 20MB。
      </p>
    </section>

    <section v-if="results.length" class="admin-card mt-5">
      <h3 class="cn-title border-b border-line pb-3 text-base">本次上传（{{ results.length }}）</h3>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in results" :key="item.url" class="border border-line bg-white">
          <SiteMediaImage :src="item.url" :alt="item.name" ratio="4 / 3" sizes="(max-width: 640px) 100vw, 33vw" />
          <div class="p-3">
            <p class="truncate text-xs text-ink">{{ item.name }}</p>
            <p class="mt-1 text-[11px]" :class="item.savedRatio ? 'text-jade' : 'text-ink-muted'">
              {{ item.size }}<template v-if="item.savedRatio"> → {{ item.compressedSize }}（省 {{ item.savedRatio }}%）</template>
              <span v-if="item.dimension" class="ml-1">{{ item.dimension }}</span>
            </p>
            <p v-if="!item.savedRatio && item.reason" class="mt-0.5 text-[11px] text-ink-muted">{{ item.reason }}</p>
            <input :value="item.url" readonly class="admin-input mt-2 !py-1.5 !text-[11px]" @focus="$event.target.select()" />
            <button class="admin-btn mt-2 !w-full !py-1.5 !text-xs" @click="copy(item.url)">复制地址</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
