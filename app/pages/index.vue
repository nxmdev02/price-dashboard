<script setup lang="ts">
const { products, companies, changes, lastCollectedAt, summary } = useDashboardData()
const { money } = useFormatters()
const detailId = ref<string | null>(null)
const lastCollectedText = computed(() => lastCollectedAt.value
  ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastCollectedAt.value)
  : '가격 수집 이력 없음')
</script>

<template>
  <div class="page-view">
  <section class="hero compact-hero"><div class="refresh-time"><span>마지막 가격 조회</span><strong>{{ lastCollectedText }}</strong></div></section>
  <section class="metrics">
    <article class="metric-link" role="link" tabindex="0" @click="navigateTo('/models')" @keyup.enter="navigateTo('/models')"><span>등록 모델</span><strong>{{ products.length }}<small>개</small></strong></article>
    <article class="metric-link" role="link" tabindex="0" @click="navigateTo('/competitors')" @keyup.enter="navigateTo('/competitors')"><span>등록 경쟁사</span><strong>{{ companies.length }}<small>개사</small></strong></article>
    <article class="metric-link" role="link" tabindex="0" @click="navigateTo('/price-comparison')" @keyup.enter="navigateTo('/price-comparison')"><span>가격 수집 완료</span><strong>{{ summary.success }}<small>건</small></strong></article>
    <article class="metric-link" role="link" tabindex="0" @click="navigateTo('/errors')" @keyup.enter="navigateTo('/errors')"><span>가격 수집 오류</span><strong>{{ summary.failed }}<small>건</small></strong></article>
  </section>
  <section class="dashboard-grid">
    <article class="card chart-card home-result-card"><div class="card-head"><h3>가격 변동 추이</h3></div><div class="empty-state"><p v-if="!changes.length">가격 변동이 없습니다.</p><p v-else>최근 {{ changes.length }}건의 실제 가격 변동이 기록되었습니다.</p></div></article>
    <article class="card activity-card"><div class="card-head"><h3>최근 가격 변동</h3><NuxtLink class="text-button" to="/price-comparison">전체 보기</NuxtLink></div>
      <div v-if="changes.length" class="activity-list"><div v-for="change in changes.slice(0, 4)" :key="change.id"><span class="activity-icon" :class="change.changeAmount > 0 ? 'up' : 'down'">{{ change.changeAmount > 0 ? '↑' : '↓' }}</span><p><strong>{{ change.modelCode }} · {{ change.companyName }}</strong><span>{{ money(change.previousPrice) }} → {{ money(change.price) }}</span></p><em>{{ money(Math.abs(change.changeAmount)) }}</em></div></div>
      <div v-else class="empty-state">가격 변동이 없습니다.</div>
    </article>
  </section>
  <ProductOverviewTable :rows="products" @detail="detailId = $event.id"/>
  <ModelDetailModal :product-id="detailId" @close="detailId = null"/>
  </div>
</template>
