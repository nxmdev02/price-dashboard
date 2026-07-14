<script setup lang="ts">
import { ExternalLink, Search } from '@lucide/vue'

const { products, companies, allMappings } = useDashboardData()
const { money, modelLabel, statusText, statusClass } = useFormatters()
const query = ref('')
const model = ref('ALL')
const competitor = ref('ALL')
const status = ref('ALL')
const sort = ref<'model' | 'low' | 'high'>('model')
const filteredMappings = computed(() => allMappings.value
  .filter(mapping => (model.value === 'ALL' || mapping.productId === model.value)
    && (competitor.value === 'ALL' || mapping.id === competitor.value)
    && (status.value === 'ALL' || mapping.lastCollectionStatus === status.value)
    && `${mapping.modelCode} ${mapping.modelWidth} ${mapping.modelDepth} ${mapping.modelHeight} ${mapping.modelDoorCount} ${mapping.companyName} ${mapping.productName || ''}`.toLowerCase().includes(query.value.toLowerCase()))
  .sort((a, b) => sort.value === 'low' ? (a.latestPrice ?? Infinity) - (b.latestPrice ?? Infinity) : sort.value === 'high' ? (b.latestPrice ?? -1) - (a.latestPrice ?? -1) : a.modelCode.localeCompare(b.modelCode, 'en', { numeric: true })))
</script>

<template>
  <div class="page-view">
  <header class="header page-actions"><div class="header-actions"><label class="search"><Search :size="19"/><input v-model="query" placeholder="모델·경쟁사·상품명 검색"></label></div></header>
  <section class="card products-card compare-card"><div class="card-head product-head"><div><h3>전체 경쟁사 가격 비교</h3><p>배송비와 옵션 추가금을 포함한 최종 가격</p></div></div>
    <div class="compare-filters"><label>모델명<select v-model="model"><option value="ALL">전체</option><option v-for="product in products" :key="product.id" :value="product.id">{{ modelLabel(product) }}</option></select></label><label>경쟁사<select v-model="competitor"><option value="ALL">전체</option><option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option></select></label><label>상태<select v-model="status"><option value="ALL">전체</option><option value="SUCCESS">정상</option><option value="FAILED">실패</option><option value="REVIEW_REQUIRED">검토 필요</option></select></label><label>정렬<select v-model="sort"><option value="model">모델 순</option><option value="low">낮은 가격 순</option><option value="high">높은 가격 순</option></select></label></div>
    <div class="table-wrap"><table><thead><tr><th>모델명</th><th>경쟁사</th><th>상품명</th><th class="right">최종 비교가격</th><th>상태</th><th>상품 링크</th></tr></thead><tbody><tr v-for="mapping in filteredMappings" :key="mapping.productId + mapping.id"><td class="model-name-cell"><strong>{{ mapping.modelCode }}</strong><span>W{{ mapping.modelWidth }} × D{{ mapping.modelDepth }} × H{{ mapping.modelHeight }}</span><small>드롭다운 도어 {{ mapping.modelDoorCount }}개</small></td><td>{{ mapping.companyName }}</td><td class="product-title-cell">{{ mapping.productName || '상품명 미등록' }}</td><td class="right price">{{ money(mapping.latestPrice) }}</td><td><span class="status-pill" :class="statusClass(mapping.lastCollectionStatus)">{{ statusText(mapping.lastCollectionStatus) }}</span></td><td><a v-if="mapping.productUrl" :href="mapping.productUrl" target="_blank"><ExternalLink :size="15"/></a></td></tr><tr v-if="!filteredMappings.length"><td colspan="6" class="empty">조건에 맞는 가격 정보가 없습니다.</td></tr></tbody></table></div>
  </section>
  </div>
</template>
