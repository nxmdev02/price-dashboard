<script setup lang="ts">
import { Pencil, Plus, Save, Search, Trash2, X } from '@lucide/vue'

const { companies, api, load } = useDashboardData()
const { notify } = useToast()
const { platformText, methodText } = useFormatters()
const query = ref('')
const modalOpen = ref(false)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)
const deleting = ref(false)
const companyForm = reactive<any>({ id: '', name: '', platform: '', baseUrl: '', defaultCollectionMethod: 'MANUAL', productUrlTemplate: '', enabled: true })
const filteredCompanies = computed(() => companies.value.filter(company => `${company.name} ${company.id}`.toLowerCase().includes(query.value.toLowerCase())))
const methodForPlatform = (platform: string) => platform === 'CAFE24' ? 'HTML_SELECTOR' : platform === 'OWN_MALL' ? 'JSON_LD' : 'MANUAL'

watch(() => companyForm.platform, value => { companyForm.defaultCollectionMethod = methodForPlatform(value) })
function openCompany(company?: any) { editing.value = company || null; Object.assign(companyForm, company ? { ...company } : { id: '', name: '', platform: '', baseUrl: '', defaultCollectionMethod: 'MANUAL', productUrlTemplate: '', enabled: true }); modalOpen.value = true }
async function saveCompany() {
  try {
    if (editing.value) await api(`/api/companies/${editing.value.id}`, { method: 'PUT', body: companyForm })
    else { companyForm.id = companyForm.name.trim(); companyForm.defaultCollectionMethod = methodForPlatform(companyForm.platform); await api('/api/companies', { method: 'POST', body: companyForm }) }
    modalOpen.value = false; await load(true); notify('경쟁사를 저장했습니다.')
  } catch (error: any) { notify(error?.data?.statusMessage || '저장하지 못했습니다.') }
}
async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try { await api(`/api/companies/${deleteTarget.value.id}`, { method: 'DELETE' }); await load(true); notify('경쟁사를 삭제했습니다.'); deleteTarget.value = null }
  catch (error: any) { notify(error?.data?.statusMessage || '삭제하지 못했습니다.') }
  finally { deleting.value = false }
}
</script>

<template>
  <div class="page-view">
  <header class="header page-actions"><div class="header-actions"><label class="search"><Search :size="19"/><input v-model="query" placeholder="경쟁사명 검색"></label><button class="add-button" @click="openCompany()"><Plus :size="18"/> 경쟁사 추가</button></div></header>
  <section class="company-grid"><article v-for="company in filteredCompanies" :key="company.id" class="company-card"><div class="card-actions"><button title="경쟁사 수정" @click="openCompany(company)"><Pencil :size="18"/></button><button class="danger-icon" title="경쟁사 삭제" @click="deleteTarget = company"><Trash2 :size="18"/></button></div><div class="company-info"><span class="status-pill company-status" :class="company.enabled ? 'enabled' : 'disabled'">{{ company.enabled ? '사용중' : '비활성' }}</span><span class="method-pill">{{ methodText(company.defaultCollectionMethod) }}</span><h3>{{ company.name }}</h3><p>{{ platformText(company.platform) }}</p></div></article></section>
  <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false"><section class="modal"><button class="modal-close" aria-label="닫기" @click="modalOpen = false"><X :size="25"/></button><form @submit.prevent="saveCompany"><h2>{{ editing ? '경쟁사 수정' : '경쟁사 추가' }}</h2><div class="form-grid"><label class="full">경쟁사명<input v-model="companyForm.name" placeholder="경쟁사명을 입력하세요" required></label><label>플랫폼<select v-model="companyForm.platform" required><option value="" disabled>플랫폼 선택</option><option value="NAVER_SMARTSTORE">네이버 스마트스토어</option><option value="CAFE24">카페24</option><option value="OWN_MALL">자사몰</option><option value="OTHER">기타</option></select></label><label>수집 방식<input :value="methodText(methodForPlatform(companyForm.platform))" disabled></label><label class="full">기본 URL<input v-model="companyForm.baseUrl" placeholder="https://example.com"></label><label class="full">상품 URL 템플릿<input v-model="companyForm.productUrlTemplate" placeholder="https://example.com/products/{productId}"></label><p v-if="companyForm.productUrlTemplate" class="full url-preview">미리보기: {{ companyForm.productUrlTemplate.replaceAll('{productId}', '12345') }}</p><label class="check"><input v-model="companyForm.enabled" type="checkbox"> 사용</label></div><div class="form-actions"><button class="add-button"><Save :size="18"/> 저장</button></div></form></section></div>
  <DeleteConfirm :open="!!deleteTarget" title="경쟁사 삭제" :target="deleteTarget?.name || ''" message="이 경쟁사 정보를 삭제합니다. 모델에 연결되어 있다면 삭제할 수 없으며 먼저 비활성화해야 합니다." :loading="deleting" @cancel="deleteTarget = null" @confirm="confirmDelete"/>
  </div>
</template>
