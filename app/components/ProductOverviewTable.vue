<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'

defineProps<{ rows: any[] }>()
defineEmits<{ detail: [product: any] }>()
const { money } = useFormatters()
const lowestMapping = (product: any) => (product.competitors || [])
  .filter((item: any) => typeof item.latestPrice === 'number')
  .sort((a: any, b: any) => a.latestPrice - b.latestPrice)[0] || null
const comparison = (product: any) => {
  const lowest = lowestMapping(product)
  if (typeof product.ownPrice !== 'number' || !lowest) return null
  const difference = lowest.latestPrice - product.ownPrice
  if (difference === 0) return { direction: 'same', difference: 0, percent: 0 }
  return {
    direction: difference > 0 ? 'up' : 'down',
    difference: Math.abs(difference),
    percent: product.ownPrice ? Math.abs(difference / product.ownPrice * 100) : 0,
  }
}
</script>

<template>
  <section class="card products-card">
    <div class="card-head product-head"><div><h3>모델별 최저가 현황</h3><p>각 모델에서 현재 가격이 가장 낮은 경쟁사 상품을 하나씩 표시합니다.</p></div></div>
    <div class="table-wrap lowest-price-scroll"><table><thead><tr><th>모델 정보</th><th>최저가 경쟁사</th><th>최저가 상품명</th><th class="right">최저가</th><th>자사 대비</th><th>상품 링크</th></tr></thead>
      <tbody><tr v-for="product in rows" :key="product.id" @click="$emit('detail', product)">
        <td><div class="product-name"><span class="product-thumb"><img :src="product.imagePath" :alt="product.modelCode"></span><p><strong>{{ product.modelCode }}</strong><span>{{ product.name }}</span></p></div></td>
        <td><strong>{{ lowestMapping(product)?.companyName || '가격 미등록' }}</strong></td>
        <td class="product-title-cell">{{ lowestMapping(product)?.productName || '상품명 미등록' }}</td>
        <td class="right price">{{ money(lowestMapping(product)?.latestPrice) }}</td>
        <td><span v-if="comparison(product)" class="market-compare" :class="comparison(product)?.direction"><b>{{ comparison(product)?.direction === 'up' ? '▲' : comparison(product)?.direction === 'down' ? '▼' : '−' }}</b><strong v-if="comparison(product)?.direction === 'same'">보합</strong><small v-if="comparison(product)?.difference">{{ money(comparison(product)?.difference) }} · {{ comparison(product)?.percent.toFixed(1) }}%</small></span><span v-else class="market-compare unavailable" title="자사 가격 미등록">-</span></td>
        <td><a v-if="lowestMapping(product)?.productUrl" :href="lowestMapping(product).productUrl" target="_blank" rel="noopener" @click.stop>상품 보기 <ExternalLink :size="15"/></a><span v-else>-</span></td>
      </tr></tbody></table></div>
  </section>
</template>
