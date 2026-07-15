<script setup lang="ts">
import { ArrowLeft, ExternalLink, Link2, Pencil, Play, Save, X } from '@lucide/vue'

const props = defineProps<{ productId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { products, companies, api, load, applyCollectionResult } = useDashboardData()
const { notify } = useToast()
const { money, shippingText, statusText, statusClass, formatDate } = useFormatters()
const selected = ref<any>(null)
const editingMapping = ref<any>(null)
const collectingOne = ref<string | null>(null)
const collectionResults = ref<Record<string, any[]>>({})
const historyPeriod = ref<'7' | '30' | '90' | 'all'>('30')
const competitorSort = ref<'price-asc' | 'price-desc'>('price-asc')
const competitorPage = ref(1)

const sortedCompetitors = computed(() => {
  const competitors = [...(selected.value?.competitors || [])]
  return competitors.sort((a: any, b: any) => {
    const aHasPrice = typeof a.latestPrice === 'number'
    const bHasPrice = typeof b.latestPrice === 'number'
    if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1
    if (!aHasPrice) return String(a.companyName || '').localeCompare(String(b.companyName || ''), 'ko')
    return competitorSort.value === 'price-asc'
      ? a.latestPrice - b.latestPrice
      : b.latestPrice - a.latestPrice
  })
})
const paginatedCompetitors = computed(() => sortedCompetitors.value.slice((competitorPage.value - 1) * 10, competitorPage.value * 10))

function rebuild() {
  const product = products.value.find(item => item.id === props.productId)
  if (!product) { selected.value = null; return }
  const existing = new Map((product.competitors || []).map((mapping: any) => [mapping.id, mapping]))
  selected.value = {
    ...product,
    competitors: companies.value.filter(company => company.enabled).map(company => {
      const mapping: any = existing.get(company.id)
      return mapping
        ? { ...mapping, priceSelector: mapping.selectorConfig?.priceSelector || '', productNameSelector: mapping.selectorConfig?.productNameSelector || '', changeReason: '' }
        : { id: company.id, companyId: company.id, companyName: company.name, productUrl: '', externalProductId: '', urlMode: 'MANUAL', collectionMethod: company.defaultCollectionMethod, priceSelector: '', productNameSelector: '', changeReason: '', latestPrice: null, shippingFee: 0, optionPrice: 0, enabled: true, lastCollectionStatus: 'IDLE' }
    }),
  }
}

watch(() => props.productId, () => { editingMapping.value = null; competitorSort.value = 'price-asc'; competitorPage.value = 1; rebuild() }, { immediate: true })
watch(competitorSort, () => { competitorPage.value = 1 })
watch(products, rebuild, { deep: false })

function generateMappingUrl(mapping: any) {
  const company = companies.value.find(item => item.id === mapping.id)
  if (!company?.productUrlTemplate) return notify('경쟁사 관리에서 URL 템플릿을 먼저 등록해 주세요.')
  if (!mapping.externalProductId) return notify('외부 제품번호를 입력해 주세요.')
  mapping.productUrl = company.productUrlTemplate.replaceAll('{productId}', mapping.externalProductId)
  mapping.urlMode = 'AUTO'
}

async function saveMapping(mapping: any) {
  if (!selected.value) return
  try {
    const old = products.value.find(item => item.id === selected.value.id)?.competitors?.find((item: any) => item.id === mapping.id)
    const changed = old && (old.productUrl !== mapping.productUrl || old.externalProductId !== mapping.externalProductId)
    if (changed && !confirm('상품 매핑 정보가 변경되었습니다. 다음 조회 결과는 새 상품의 기준가격으로 등록됩니다. 계속할까요?')) return
    const result = await api<any>(`/api/products/${selected.value.id}/competitors/${mapping.id}`, { method: 'PUT', body: { ...mapping, selectorConfig: { priceSelector: mapping.priceSelector, productNameSelector: mapping.productNameSelector } } })
    await load(true)
    editingMapping.value = null
    rebuild()
    notify(result.mappingChanged ? '매핑 변경 이력을 저장했습니다.' : '경쟁사 정보를 저장했습니다.')
  } catch (error: any) {
    notify(error?.data?.statusMessage || '저장하지 못했습니다.')
  }
}

async function collectOne(mapping: any) {
  if (collectingOne.value || !selected.value) return
  collectingOne.value = mapping.id
  try {
    const id = selected.value.id
    const response = await api<any>(`/api/products/${id}/competitors/${mapping.id}/collect`, { method: 'POST' })
    collectionResults.value[id] = [response.result]
    applyCollectionResult(id, mapping.id, response.result)
    rebuild()
    notify(response.result?.status === 'SKIPPED' ? `${mapping.companyName}은 수동 입력 상품입니다.` : `${mapping.companyName} 조회를 완료했습니다.`)
  } catch (error: any) {
    notify(error?.data?.statusMessage || '개별 조회에 실패했습니다.')
  } finally {
    collectingOne.value = null
  }
}

function visibleHistory(mapping: any) {
  const cutoff = historyPeriod.value === 'all' ? 0 : Date.now() - Number(historyPeriod.value) * 86400000
  return (mapping.priceHistories || []).filter((item: any) => new Date(item.changedAt).getTime() >= cutoff)
}

function historyPoints(mapping: any) {
  const history = visibleHistory(mapping)
  if (!history.length) return ''
  const values = history.map((item: any) => item.price)
  const min = Math.min(...values), max = Math.max(...values)
  const y = (value: number) => max === min ? 28 : 50 - (value - min) / (max - min) * 42
  if (history.length === 1) return `0,${y(values[0])} 240,${y(values[0])}`
  let output = `0,${y(values[0])}`
  for (let index = 1; index < history.length; index++) {
    const x = index / (history.length - 1) * 240
    output += ` ${x},${y(values[index - 1])} ${x},${y(values[index])}`
  }
  return output
}
</script>

<template>
  <div v-if="productId && selected" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal wide-modal"><button class="modal-close" aria-label="닫기" @click="emit('close')"><X :size="25"/></button>
      <template v-if="editingMapping">
        <div class="mapping-editor-head"><button @click="editingMapping = null"><ArrowLeft :size="19"/> 가격 현황으로</button><div><p>경쟁사 매핑 편집</p><h2>{{ editingMapping.companyName }}</h2></div></div>
        <div class="mapping-editor-grid">
          <label>외부 제품번호<input v-model="editingMapping.externalProductId"><button class="inline-button" @click="generateMappingUrl(editingMapping)"><Link2 :size="15"/> URL 자동 생성</button></label>
          <label class="span-three">상품 URL<input v-model="editingMapping.productUrl" placeholder="https://..."></label>
          <label>수집 방식<select v-model="editingMapping.collectionMethod"><option>MANUAL</option><option>HTML_SELECTOR</option><option>JSON_LD</option><option>CAFE24_API</option><option>NAVER_SEARCH_API</option></select></label>
          <label>최종 비교가격<input v-model.number="editingMapping.latestPrice" type="number"></label><label>배송비<input v-model.number="editingMapping.shippingFee" type="number"></label><label>옵션 추가금<input v-model.number="editingMapping.optionPrice" type="number"></label>
          <label>가격 selector<input v-model="editingMapping.priceSelector" placeholder="예: .sale_price"></label><label>상품명 selector<input v-model="editingMapping.productNameSelector" placeholder="예: h2"></label><label class="span-two">매핑 변경 사유<input v-model="editingMapping.changeReason" placeholder="URL이나 제품번호 변경 시 입력"></label>
        </div>
        <div class="mapping-editor-actions"><button class="secondary-button" :disabled="!editingMapping.productUrl || collectingOne === editingMapping.id" @click="collectOne(editingMapping)"><Play :size="17"/> {{ collectingOne === editingMapping.id ? '조회 중' : '개별 조회' }}</button><button class="add-button" @click="saveMapping(editingMapping)"><Save :size="17"/> 저장</button></div>
      </template>
      <template v-else>
        <div class="detail-head"><img :src="selected.imagePath" :alt="selected.modelCode"><div><h2>{{ selected.modelCode }}</h2><p>{{ selected.width }} × {{ selected.depth }} × {{ selected.height }} mm · 드롭다운 도어 {{ selected.doorCount }}개</p></div></div>
        <div v-if="collectionResults[selected.id]?.length" class="result-panel"><strong>최근 조회 결과</strong><span v-for="result in collectionResults[selected.id]" :key="result.companyId">{{ result.companyName }} · {{ statusText(result.status) }} · {{ money(result.price) }}</span></div>
        <section class="history-section"><div class="card-head"><div><h3>가격 변동 그래프</h3><p>변동 시점 기준 계단형 가격 추이</p></div><div class="periods"><button v-for="period in ['7', '30', '90', 'all']" :key="period" :class="{ active: historyPeriod === period }" @click="historyPeriod = period as any">{{ period === 'all' ? '전체' : period + '일' }}</button></div></div>
          <div v-if="selected.competitors.some((mapping: any) => visibleHistory(mapping).length)" class="history-series"><div v-for="mapping in selected.competitors.filter((item: any) => visibleHistory(item).length)" :key="mapping.id"><strong>{{ mapping.companyName }}</strong><svg viewBox="0 0 240 56" preserveAspectRatio="none"><polyline :points="historyPoints(mapping)" fill="none" stroke="#6656ef" stroke-width="2"/></svg><span>{{ money(visibleHistory(mapping).at(-1)?.price) }}<small v-if="mapping.mappingHistories?.length">매핑 변경 {{ mapping.mappingHistories.length }}회</small></span></div></div>
          <div v-else class="empty-state small-empty">선택한 기간의 가격 이력이 없습니다.</div>
        </section>
        <section class="competitor-summary"><div class="section-title competitor-title"><h3>경쟁사 가격 현황</h3><div class="price-sort-links"><button :class="{ active: competitorSort === 'price-asc' }" @click="competitorSort = 'price-asc'">낮은 가격순</button><span>·</span><button :class="{ active: competitorSort === 'price-desc' }" @click="competitorSort = 'price-desc'">높은 가격순</button></div></div><div class="table-wrap"><table><thead><tr><th>경쟁사</th><th>현재 가격</th><th>배송비</th><th>최근 조회</th><th>상태</th><th>상품 링크</th><th>관리</th></tr></thead><tbody>
          <tr v-for="mapping in paginatedCompetitors" :key="mapping.id"><td><strong>{{ mapping.companyName }}</strong></td><td class="price">{{ money(mapping.latestPrice) }}</td><td>{{ shippingText(mapping.shippingFee) }}</td><td>{{ formatDate(mapping.latestCheckedAt) }}</td><td><span class="status-pill" :class="statusClass(mapping.productUrl ? mapping.lastCollectionStatus : 'IDLE')">{{ mapping.productUrl ? statusText(mapping.lastCollectionStatus) : '미정' }}</span></td><td><a v-if="mapping.productUrl" :href="mapping.productUrl" target="_blank" rel="noopener" aria-label="상품 링크" title="상품 링크"><ExternalLink :size="17"/></a><span v-else>-</span></td><td><div class="table-actions"><button title="매핑 수정" @click="editingMapping = { ...mapping }"><Pencil :size="17"/></button><button title="개별 조회" :disabled="!mapping.productUrl || collectingOne === mapping.id" @click="collectOne(mapping)"><Play :size="17"/></button></div></td></tr>
        </tbody></table></div><PaginationControls v-model:page="competitorPage" :total="sortedCompetitors.length"/></section>
      </template>
    </section>
  </div>
</template>
