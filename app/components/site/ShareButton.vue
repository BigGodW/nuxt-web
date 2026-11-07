<script setup>
/**
 * 全站统一分享入口（文章 / 商品复用）
 * ------------------------------------------------------------
 * 主按钮 → 中国风分享面板：系统一键分享、微信二维码与右上角引导、
 * 抖音海报/文案、微博/QQ 网页直跳、复制链接、分享海报。
 * 所有同平台差异集中在 app/utils/share.js，便于后期接公众号 JS-SDK。
 */
import { Popup, showToast } from 'vant'
import {
  detectShareEnv, SHARE_PLATFORMS, normalizeShareUrl, buildShareLink,
  copyToClipboard, systemShare, buildSharePoster, savePoster, posterQrUrl
} from '../../utils/share.js'

const props = defineProps({
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  image: { type: String, default: '' },
  url: { type: String, default: '' },
  price: { type: String, default: '' },
  tag: { type: String, default: '' },
  kind: { type: String, default: 'article' }
})

const show = ref(false)
const env = ref(detectShareEnv())
const hint = ref('')
const showQr = ref(false)
const poster = ref(null)
const posterBusy = ref(false)

const requestUrl = useRequestURL()
const runtime = useRuntimeConfig()
const { settings } = useSiteSettings()

const siteName = computed(() => settings.value?.siteName || runtime.public?.siteName || '云涧')
const shareUrl = computed(() => normalizeShareUrl(props.url || requestUrl.href, runtime.public?.siteUrl || ''))
const absoluteImage = computed(() => imageUrl(props.image))
const qrUrl = computed(() => posterQrUrl(shareUrl.value, 240))
const shareText = computed(() => `${props.title}${props.summary ? `｜${props.summary}` : ''}`)

const toneClass = {
  jade: 'border-jade/40 bg-jade-light text-jade',
  ink: 'border-ink/20 bg-paper-deep text-ink',
  cinnabar: 'border-cinnabar/30 bg-cinnabar/5 text-cinnabar',
  gold: 'border-gold/40 bg-paper-deep/60 text-gold'
}

onMounted(() => { env.value = detectShareEnv() })

function openPanel() {
  show.value = true
  hint.value = ''
  showQr.value = false
  poster.value = null
}

function payload() {
  return {
    url: shareUrl.value,
    title: props.title,
    summary: props.summary,
    image: absoluteImage.value,
    siteName: siteName.value
  }
}

async function onPick(key) {
  hint.value = ''
  showQr.value = false

  if (key === 'wechat' || key === 'moments') {
    if (env.value.wechat) {
      hint.value = '请点击微信右上角「···」→ 选择「发送给朋友」或「分享到朋友圈」。页面标题与封面已配置好，分享卡片会自动带上。'
    } else {
      showQr.value = true
      hint.value = '用微信「扫一扫」下方二维码打开本页，再点右上角「···」即可分享给朋友或朋友圈。'
    }
    return
  }

  if (key === 'douyin') {
    if (env.value.douyin) {
      hint.value = '请点击抖音右上角「··· / 分享箭头」，把本页分享给好友或收藏。'
    } else {
      try {
        await copyToClipboard(`${shareText.value}\n${shareUrl.value}`)
        hint.value = '已复制「标题 + 摘要 + 链接」。保存下方海报后，可在抖音发布图文或发给好友。'
      } catch {
        hint.value = '保存下方海报后，可在抖音发布图文；链接可在面板中手动复制。'
      }
      await makePoster()
    }
    return
  }

  if (['weibo', 'qq', 'qzone'].includes(key)) {
    window.open(buildShareLink(key, payload()), '_blank', 'noopener,noreferrer,width=760,height=620')
    return
  }

  if (key === 'copy') {
    try {
      await copyToClipboard(shareUrl.value)
      showToast('链接已复制，去粘贴给朋友吧')
    } catch (error) {
      showToast(error.message || '复制失败，请长按地址栏复制')
    }
    return
  }

  if (key === 'poster') await makePoster()
}

async function onSystemShare() {
  try {
    await systemShare({ title: props.title, text: shareText.value, url: shareUrl.value })
  } catch (error) {
    if (error?.name !== 'AbortError') showToast(error.message || '系统分享不可用')
  }
}

async function makePoster() {
  posterBusy.value = true
  try {
    poster.value = await buildSharePoster({
      title: props.title,
      summary: props.summary,
      price: props.price,
      image: props.image,
      url: shareUrl.value,
      siteName: siteName.value,
      tag: props.tag
    })
  } catch (error) {
    showToast(error.message || '海报生成失败')
  } finally {
    posterBusy.value = false
  }
}

async function sharePosterFile() {
  if (!poster.value) return
  const file = new File([poster.value.blob], '云涧分享海报.png', { type: 'image/png' })
  try {
    await systemShare({ title: props.title, text: shareText.value, files: [file] })
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('当前浏览器不支持分享图片，请先保存海报')
  }
}
</script>

<template>
  <div class="inline-block">
    <button
      type="button"
      class="inline-flex items-center gap-2 border border-line bg-paper-card px-3.5 py-2 text-[11px] tracking-[0.18em] text-ink-soft transition-colors hover:border-cinnabar hover:text-cinnabar sm:px-4 sm:text-xs sm:tracking-[0.22em]"
      @click="openPanel"
    >
      <span class="cn-seal h-5 w-5 text-[11px] tracking-normal sm:h-6 sm:w-6">享</span>
      分享给朋友
    </button>

    <Popup v-model:show="show" position="bottom" round :style="{ maxHeight: '82vh' }">
      <div class="max-h-[82vh] overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
        <div class="mx-auto max-w-[520px]">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="cn-title text-base sm:text-lg">分享{{ kind === 'product' ? '此器物' : '此文' }}</h3>
              <p class="mt-1 text-[11px] tracking-widest text-ink-muted">让好物与好文，抵达更多人</p>
              <div class="mt-2 h-px w-10 bg-cinnabar" />
            </div>
            <button type="button" class="shrink-0 px-1 text-xl leading-none text-ink-muted" aria-label="关闭" @click="show = false">×</button>
          </div>

          <!-- 系统原生分享：Web 端唯一能一次点击流向微信/抖音等 App 的能力 -->
          <button
            v-if="env.webShare"
            type="button"
            class="mt-4 flex w-full items-center justify-between gap-2 border border-cinnabar bg-cinnabar px-4 py-3 text-left text-white"
            @click="onSystemShare"
          >
            <span class="text-[13px] tracking-[0.12em]">一键分享到微信 / 抖音等 App</span>
            <span class="text-[11px] opacity-80">系统分享 →</span>
          </button>

          <div class="mt-4 grid grid-cols-4 gap-y-4">
            <button v-for="item in SHARE_PLATFORMS" :key="item.key" type="button" class="flex flex-col items-center gap-1.5" @click="onPick(item.key)">
              <span class="flex h-11 w-11 items-center justify-center rounded-full border font-serif-cn text-base transition-transform active:scale-95" :class="toneClass[item.tone]">{{ item.mark }}</span>
              <span class="text-[11px] text-ink-soft">{{ item.label }}</span>
            </button>
          </div>

          <div v-if="hint" class="mt-4 border border-gold/50 bg-paper-deep/50 p-3 text-[12px] leading-6 text-ink-soft">{{ hint }}</div>

          <div v-if="showQr" class="mt-3 flex flex-col items-center gap-2 border border-line bg-white p-4">
            <img :src="qrUrl" alt="本页二维码" class="h-36 w-36" />
            <span class="text-[11px] text-ink-muted">微信扫一扫 · 打开后点右上角分享</span>
            <button type="button" class="admin-btn !w-auto !px-4 !py-1.5 !text-[11px]" @click="onPick('copy')">复制链接</button>
          </div>

          <div v-if="posterBusy" class="mt-4 py-4 text-center text-xs text-ink-muted">正在绘制分享海报…</div>
          <div v-if="poster" class="mt-4">
            <img :src="poster.dataUrl" alt="分享海报" class="mx-auto w-full max-w-[260px] border border-line" />
            <div class="mx-auto mt-2 flex max-w-[260px] gap-2">
              <button type="button" class="admin-btn flex-1 !py-1.5 !text-[11px]" @click="savePoster(poster.dataUrl)">保存海报</button>
              <button v-if="env.webShare" type="button" class="admin-btn flex-1 !py-1.5 !text-[11px]" @click="sharePosterFile">分享图片</button>
            </div>
            <p class="mt-2 text-[11px] leading-5 text-ink-muted">移动端可长按图片保存；发朋友圈或抖音图文时，搭配已复制的文案效果更佳。</p>
          </div>

          <p class="mt-4 border-t border-line pt-3 text-[10px] leading-5 text-ink-muted">
            微信 / 抖音内置浏览器请点右上角「···」分享；其它环境可扫码、复制链接或保存海报后发布。
          </p>
        </div>
      </div>
    </Popup>
  </div>
</template>
