<script setup>
const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  total: { type: Number, default: 0 }
})
const emit = defineEmits(['change'])
</script>

<template>
  <div v-if="totalPages > 1" class="mt-6 flex flex-wrap items-center justify-between gap-3">
    <p class="text-xs text-ink-muted">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</p>
    <div class="flex gap-2">
      <button class="admin-btn" :disabled="page <= 1" @click="emit('change', page - 1)">上一页</button>
      <button class="admin-btn" :disabled="page >= totalPages" @click="emit('change', page + 1)">下一页</button>
    </div>
  </div>
  <p v-else-if="total" class="mt-6 text-xs text-ink-muted">共 {{ total }} 条</p>
</template>
