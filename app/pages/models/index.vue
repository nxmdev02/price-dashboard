<script setup lang="ts">
import { Eye, Pencil, Plus, Save, Search, Trash2, X } from '@lucide/vue'

const { products, api, load } = useDashboardData()
const { notify } = useToast()
const { productStatusText } = useFormatters()
const query = ref('')
const filterStatus = ref('ALL')
const modalOpen = ref(false)
const editing = ref<any>(null)
const detailId = ref<string | null>(null)
const deleting = ref(false)
const deleteTarget = ref<any>(null)
const productForm = reactive<any>({ modelCode: '', name: '', width: '', depth: '', height: '', doorCount: '', ownPrice: '', imagePath: '', notes: '', status: 'ACTIVE', enabled: true })
const filteredProducts = computed(() => products.value.filter(product => (filterStatus.value === 'ALL' || product.status === filterStatus.value) && `${product.modelCode} ${product.name}`.toLowerCase().includes(query.value.toLowerCase())))

function openProduct(product?: any) {
  editing.value = product || null
  const number = String(products.value.length + 1).padStart(3, '0')
  Object.assign(productForm, product ? { ...product, ownPrice: product.ownPrice ?? '', imagePath: product.imagePath ?? '', notes: product.notes ?? '' } : { modelCode: `MODEL-${number}`, name: '', width: '', depth: '', height: '', doorCount: '', ownPrice: '', imagePath: `/images/model-${number}.png`, notes: '', status: 'ACTIVE', enabled: true })
  modalOpen.value = true
}

async function saveProduct() {
  try {
    if (editing.value) await api(`/api/products/${editing.value.id}`, { method: 'PUT', body: productForm })
    else await api('/api/products', { method: 'POST', body: productForm })
    modalOpen.value = false
    await load(true)
    notify('모델을 저장했습니다.')
  } catch (error: any) { notify(error?.data?.statusMessage || '저장하지 못했습니다.') }
}

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await api(`/api/products/${deleteTarget.value.id}`, { method: 'DELETE' })
    await load(true)
    notify('모델을 삭제했습니다.')
    deleteTarget.value = null
  } catch (error: any) { notify(error?.data?.statusMessage || '삭제하지 못했습니다.') }
  finally { deleting.value = false }
}
</script>

<template>
  <div class="page-view">
  <header class="header page-actions"><div class="header-actions"><label class="search"><Search :size="19"/><input v-model="query" placeholder="모델 코드 또는 모델명 검색"></label><button class="add-button" @click="openProduct()"><Plus :size="18"/> 모델 추가</button></div></header>
  <section class="page-tools"><select v-model="filterStatus"><option value="ALL">전체 상태</option><option value="ACTIVE">사용중</option><option value="DRAFT">초안</option><option value="ARCHIVED">보관</option></select></section>
  <section class="model-grid"><article v-for="product in filteredProducts" :key="product.id" class="model-card">
    <div class="model-card-toolbar"><span class="status-pill model-card-status">{{ productStatusText(product.status) }}</span><div class="card-actions"><button title="가격 상세" @click="detailId = product.id"><Eye :size="18"/></button><button title="모델 수정" @click="openProduct(product)"><Pencil :size="18"/></button><button class="danger-icon" title="모델 삭제" @click="deleteTarget = product"><Trash2 :size="18"/></button></div></div>
    <div class="model-image"><img :src="product.imagePath" :alt="product.modelCode"></div><div class="model-card-info"><h3>{{ product.modelCode }}</h3><p>{{ product.doorCount }}개 드롭다운 도어</p><strong>{{ product.width }} × {{ product.depth }} × {{ product.height }} mm</strong></div>
  </article></section>
  <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false"><section class="modal"><button class="modal-close" aria-label="닫기" @click="modalOpen = false"><X :size="25"/></button>
    <form @submit.prevent="saveProduct"><h2>{{ editing ? '모델 수정' : '모델 추가' }}</h2><div class="form-grid"><label>모델 코드<input v-model="productForm.modelCode" :disabled="!!editing" required></label><label>모델명<input v-model="productForm.name" placeholder="내부에서 사용할 모델명" required></label><label>너비(mm)<input v-model="productForm.width" type="number"></label><label>깊이(mm)<input v-model="productForm.depth" type="number"></label><label>높이(mm)<input v-model="productForm.height" type="number"></label><label>도어 수<input v-model="productForm.doorCount" type="number"></label><label>자사 가격<input v-model="productForm.ownPrice" type="number"></label><label>운영 상태<select v-model="productForm.status"><option value="ACTIVE">사용중</option><option value="DRAFT">초안</option><option value="ARCHIVED">보관</option></select></label><label class="full">이미지 경로<input v-model="productForm.imagePath"></label><label class="full">메모<textarea v-model="productForm.notes"/></label></div><div class="form-actions"><button class="add-button"><Save :size="18"/> 저장</button></div></form>
  </section></div>
  <DeleteConfirm :open="!!deleteTarget" title="모델 삭제" :target="deleteTarget?.modelCode || ''" message="연결된 경쟁사 가격 매핑과 이력도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다." :loading="deleting" @cancel="deleteTarget = null" @confirm="confirmDelete"/>
  <ModelDetailModal :product-id="detailId" @close="detailId = null"/>
  </div>
</template>
