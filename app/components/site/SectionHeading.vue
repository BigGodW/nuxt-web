<script setup>
defineProps({
  title: { type: String, required: true },
  en: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  center: { type: Boolean, default: false }
})
</script>

<template>
  <div :class="center ? 'text-center' : 'text-left'">
    <p v-if="en" class="text-[9px] uppercase tracking-[0.35em] text-gold sm:text-[10px] sm:tracking-[0.42em]">{{ en }}</p>
    <h2 class="cn-title mt-2 text-xl sm:mt-3 sm:text-2xl md:text-3xl">{{ title }}</h2>
    <div class="mt-3 flex items-center gap-2.5 sm:mt-4 sm:gap-3" :class="center ? 'justify-center' : ''">
      <span class="h-px w-8 bg-cinnabar sm:w-10" />
      <span class="h-1.5 w-1.5 rotate-45 bg-gold" />
      <span class="h-px w-8 bg-line sm:w-10" />
    </div>
    <p v-if="subtitle" class="mt-3 max-w-2xl text-[13px] leading-6 text-ink-muted sm:mt-4 sm:text-sm sm:leading-7" :class="center ? 'mx-auto' : ''">{{ subtitle }}</p>
  </div>
</template>
