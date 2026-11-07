<script setup>
const { settings, loadSettings } = useSiteSettings()
await loadSettings()

useHead({
  meta: [
    { name: 'description', content: settings.value.siteDescription || '云涧，甄选东方器物、茶瓷文房，记录有温度的生活美学。' },
    { name: 'keywords', content: settings.value.siteKeywords || '东方美学,茶器,青瓷,文房' }
  ]
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
