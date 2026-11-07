<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
    <div>
      <h2 class="cn-title text-lg sm:text-xl md:text-2xl">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-[11px] text-ink-muted sm:mt-1.5 sm:text-xs">{{ description }}</p>
      <div class="mt-2 h-px w-10 bg-cinnabar sm:mt-3 sm:w-12" />
    </div>
    <div class="flex flex-wrap gap-1.5 sm:gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
