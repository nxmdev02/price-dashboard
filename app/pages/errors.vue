<script setup lang="ts">
import { AlertCircle, Eye } from '@lucide/vue'

const { products, failedMappings } = useDashboardData()
const detailId = ref<string | null>(null)
</script>

<template>
  <div class="page-view">
  <section class="card error-list"><div class="card-head"><div><h3>가격 수집 오류 및 검토 항목</h3><p>실패 원인을 확인한 뒤 모델 상세에서 URL이나 가격을 수정하세요.</p></div></div>
    <div v-if="failedMappings.length"><article v-for="mapping in failedMappings" :key="mapping.productId + mapping.id"><span class="activity-icon review"><AlertCircle :size="20"/></span><div><strong>{{ mapping.modelCode }} · {{ mapping.companyName }}</strong><p>{{ mapping.lastCollectionError || '가격 확인이 필요합니다.' }}</p></div><button @click="detailId = products.find(product => product.id === mapping.productId)?.id || null"><Eye :size="17"/> 확인</button></article></div>
    <div v-else class="empty-state">현재 가격 수집 오류가 없습니다.</div>
  </section>
  <ModelDetailModal :product-id="detailId" @close="detailId = null"/>
  </div>
</template>
