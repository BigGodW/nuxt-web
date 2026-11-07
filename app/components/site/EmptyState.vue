<script setup>
defineProps({ text: { type: String, default: '暂无内容' } })
</script>

<template>
  <div class="cn-frame flex flex-col items-center justify-center gap-2.5 px-5 py-10 text-center sm:gap-3 sm:px-6 sm:py-16">
    <span class="font-serif-cn text-3xl text-gold sm:text-4xl">空</span>
    <p class="text-[13px] tracking-widest text-ink-muted sm:text-sm">{{ text }}</p>
    <NuxtLink to="/" class="mt-1.5 text-xs tracking-widest text-cinnabar sm:mt-2">回到首页 →</NuxtLink>
  </div>
</template>
