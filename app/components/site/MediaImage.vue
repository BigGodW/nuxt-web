<script setup>
/**
 * 全站统一图片组件
 * ------------------------------------------------------------
 * 兼容：七牛云 key / 完整外链 / 站内静态图
 * 加速：
 * - 自有 CDN 图片自动追加 imageView2（按宽度缩略 + WebP + 质量控制）
 * - 通过 srcset / sizes 让浏览器按 DPR 与容器宽度挑档位
 * - 首屏图可设 priority（eager + fetchpriority=high），其余懒加载
 * - 转码地址异常时自动回退原图，再失败才显示中国风占位
 */
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  ratio: { type: String, default: '4 / 3' },
  fill: { type: Boolean, default: false },
  // 告诉浏览器图片在布局中占多宽，直接影响 srcset 选中档位
  sizes: { type: String, default: '100vw' },
  // 自定义候选宽度；不传则使用 runtimeConfig.public.image.srcsetWidths
  widths: { type: Array, default: null },
  priority: { type: Boolean, default: false },
  quality: { type: Number, default: 0 }
})

const failed = ref(false)
const useOriginal = ref(false)
const baseUrl = computed(() => imageUrl(props.src))
const srcset = computed(() => (useOriginal.value ? '' : qiniuSrcset(props.src, props.widths)))
const url = computed(() => {
  if (useOriginal.value) return baseUrl.value
  const list = props.widths?.length ? props.widths : null
  const primary = list ? list[Math.floor(list.length / 2)] : 800
  return qiniuImage(props.src, primary, props.quality)
})

// 仅当图片源变化时重置状态；监听 srcset 会与「回退原图」互相触发
watch(baseUrl, () => {
  failed.value = false
  useOriginal.value = false
})

function onError() {
  if (!useOriginal.value && srcset.value) {
    useOriginal.value = true
    return
  }
  failed.value = true
}
</script>

<template>
  <div
    class="img-placeholder relative overflow-hidden"
    :class="fill ? 'h-full w-full' : 'w-full'"
    :style="fill ? {} : { aspectRatio: ratio }"
  >
    <img
      v-if="url && !failed"
      :src="url"
      :srcset="srcset || undefined"
      :sizes="srcset ? sizes : undefined"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
      @error="onError"
    />
    <div v-else class="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 text-ink-muted">
      <span class="font-serif-cn text-4xl opacity-60">{{ (alt || '云').slice(0, 1) }}</span>
      <span class="text-[10px] tracking-[0.4em] opacity-70">YUN JIAN</span>
    </div>
  </div>
</template>
