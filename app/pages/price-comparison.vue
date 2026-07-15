<script setup lang="ts">
import { ExternalLink, Search } from '@lucide/vue'

const { products, companies, allMappings } = useDashboardData()
const { money, modelLabel, statusText, statusClass } = useFormatters()
const query = ref('')
const model = ref('ALL')
const modelInitialized = ref(false)
const competitor = ref('ALL')
const status = ref('ALL')
const sort = ref<'low' | 'high'>('low')
const page = ref(1)
const filteredMappings = computed(() => allMappings.value
  .filter(mapping => (model.value === 'ALL' || mapping.productId === model.value)
    && (competitor.value === 'ALL' || mapping.id === competitor.value)
    && (status.value === 'ALL' || mapping.lastCollectionStatus === status.value)
    && `${mapping.modelCode} ${mapping.modelWidth} ${mapping.modelDepth} ${mapping.modelHeight} ${mapping.modelDoorCount} ${mapping.companyName} ${mapping.productName || ''}`.toLowerCase().includes(query.value.toLowerCase()))
  .sort((a, b) => sort.value === 'low' ? (a.latestPrice ?? Infinity) - (b.latestPrice ?? Infinity) : (b.latestPrice ?? -1) - (a.latestPrice ?? -1)))
const paginatedMappings = computed(() => filteredMappings.value.slice((page.value - 1) * 10, page.value * 10))
watch(products, (items) => {
  if (modelInitialized.value || !items.length) return
  model.value = items.find(product => product.modelCode === 'MODEL-001')?.id || items[0].id
  modelInitialized.value = true
}, { immediate: true })
watch([query, model, competitor, status, sort], () => { page.value = 1 })
</script>

<template>
  <div class="page-view">
  <header class="header page-actions"><div class="header-actions"><label class="search"><Search :size="19"/><input v-model="query" placeholder="모델·경쟁사·상품명 검색"></label></div></header>
  <section class="card products-card compare-card"><div class="card-head product-head"><div><h3>전체 경쟁사 가격 비교</h3><p>배송비와 옵션 추가금을 포함한 최종 가격</p></div><div class="price-sort-links"><button :class="{ active: sort === 'low' }" @click="sort = 'low'">낮은 가격순</button><span>·</span><button :class="{ active: sort === 'high' }" @click="sort = 'high'">높은 가격순</button></div></div>
    <div class="compare-filters"><label>모델명<select v-model="model"><option value="ALL">전체</option><option v-for="product in products" :key="product.id" :value="product.id">{{ modelLabel(product) }}</option></select></label><label>경쟁사<select v-model="competitor"><option value="ALL">전체</option><option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option></select></label><label>상태<select v-model="status"><option value="ALL">전체</option><option value="SUCCESS">정상</option><option value="FAILED">실패</option><option value="REVIEW_REQUIRED">검토 필요</option></select></label></div>
    <div class="table-wrap"><table><thead><tr><th>모델명</th><th>경쟁사</th><th class="right">최종 비교가격</th><th>상태</th><th>링크</th></tr></thead><tbody><tr v-for="mapping in paginatedMappings" :key="mapping.productId + mapping.id"><td class="model-name-cell"><strong>{{ mapping.modelCode }}</strong><span class="model-details"> · W{{ mapping.modelWidth }} × D{{ mapping.modelDepth }} × H{{ mapping.modelHeight }} · 드롭다운 도어 {{ mapping.modelDoorCount }}개</span></td><td>{{ mapping.companyName }}</td><td class="right price">{{ money(mapping.latestPrice) }}</td><td><span class="status-pill" :class="statusClass(mapping.lastCollectionStatus)">{{ statusText(mapping.lastCollectionStatus) }}</span></td><td><a v-if="mapping.productUrl" :href="mapping.productUrl" target="_blank" aria-label="상품 링크"><ExternalLink :size="15"/></a></td></tr><tr v-if="!filteredMappings.length"><td colspan="5" class="empty">조건에 맞는 가격 정보가 없습니다.</td></tr></tbody></table></div>
    <PaginationControls v-model:page="page" :total="filteredMappings.length"/>
  </section>
  </div>
</template>
