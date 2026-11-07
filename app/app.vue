<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// 全站入口：布局由 layouts/ 决定，页面由 pages/ 决定
useHead({
  titleTemplate: (title) => (title ? `${title} · 云涧` : '云涧 · 东方器物与生活美学')
})
</script>
