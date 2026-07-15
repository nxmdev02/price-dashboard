<script setup lang="ts">
const props = withDefaults(defineProps<{ page: number; total: number; pageSize?: number }>(), { pageSize: 10 })
const emit = defineEmits<{ 'update:page': [page: number] }>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const start = computed(() => props.total ? (props.page - 1) * props.pageSize + 1 : 0)
const end = computed(() => Math.min(props.page * props.pageSize, props.total))

function move(page: number) {
  emit('update:page', Math.min(pageCount.value, Math.max(1, page)))
}
</script>

<template>
  <nav v-if="total > pageSize" class="table-pagination" aria-label="테이블 페이지 이동">
    <span>{{ start }}–{{ end }} / {{ total }}</span>
    <div>
      <button :disabled="page <= 1" aria-label="이전 페이지" @click="move(page - 1)">‹</button>
      <strong>{{ page }} / {{ pageCount }}</strong>
      <button :disabled="page >= pageCount" aria-label="다음 페이지" @click="move(page + 1)">›</button>
    </div>
  </nav>
</template>
