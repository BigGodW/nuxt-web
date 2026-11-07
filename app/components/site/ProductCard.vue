<script setup>
const props = defineProps({ product: { type: Object, required: true } })
const price = computed(() => formatPrice(props.product.price))
const hasDiscount = computed(() => props.product.originalPrice && Number(props.product.originalPrice) > Number(props.product.price))
</script>

<template>
  <NuxtLink :to="`/products/${product.slug}`" class="cn-card group flex flex-col">
    <div class="relative">
      <SiteMediaImage :src="product.coverImage" :alt="product.name" ratio="1 / 1" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
      <span v-if="product.isFeatured" class="absolute left-0 top-0 bg-cinnabar px-2 py-1 text-[10px] tracking-widest text-white sm:px-3 sm:py-1.5 sm:text-[11px]">精选</span>
      <span v-else-if="product.type?.name" class="absolute left-0 top-0 bg-ink/75 px-2 py-1 text-[10px] tracking-widest text-paper sm:px-3 sm:py-1.5 sm:text-[11px]">{{ product.type.name }}</span>
    </div>
    <div class="flex flex-1 flex-col p-3 sm:p-5">
      <p class="truncate text-[10px] tracking-widest text-ink-muted sm:text-[11px]">{{ product.category?.name || '东方器物' }}</p>
      <h3 class="cn-title mt-1.5 line-clamp-1 text-[15px] transition-colors group-hover:text-cinnabar sm:mt-2 sm:text-lg">{{ product.name }}</h3>
      <p class="mt-1 line-clamp-1 text-[11px] text-ink-muted sm:text-xs">{{ product.subtitle || product.summary }}</p>
      <div class="mt-auto flex items-baseline gap-1.5 pt-3 sm:gap-2 sm:pt-4">
        <span class="font-serif-cn text-base text-cinnabar sm:text-lg">{{ price }}</span>
        <span v-if="hasDiscount" class="hidden text-xs text-ink-muted line-through sm:inline">{{ formatPrice(product.originalPrice) }}</span>
        <span class="ml-auto hidden text-xs tracking-widest text-gold opacity-0 transition-opacity group-hover:opacity-100 sm:inline">细看 →</span>
      </div>
    </div>
  </NuxtLink>
</template>
