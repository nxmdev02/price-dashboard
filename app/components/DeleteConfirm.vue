<script setup lang="ts">
import { Trash2 } from '@lucide/vue'

defineProps<{ open: boolean, title: string, target: string, message: string, loading?: boolean }>()
defineEmits<{ cancel: [], confirm: [] }>()
</script>

<template>
  <div v-if="open" class="delete-confirm-backdrop" @click.self="$emit('cancel')">
    <section class="delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title">
      <div class="delete-confirm-icon"><Trash2 :size="23"/></div>
      <h2 id="delete-confirm-title">{{ title }}</h2><strong>{{ target }}</strong><p>{{ message }}</p>
      <div class="delete-confirm-actions">
        <button class="cancel-button" :disabled="loading" @click="$emit('cancel')">취소</button>
        <button class="confirm-delete-button" :disabled="loading" @click="$emit('confirm')"><span v-if="loading" class="spinner"/>{{ loading ? '삭제 중' : '삭제' }}</button>
      </div>
    </section>
  </div>
</template>
