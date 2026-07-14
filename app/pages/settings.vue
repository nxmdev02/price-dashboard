<script setup lang="ts">
import { LogOut, Save } from '@lucide/vue'

const { settings, api, persist } = useDashboardData()
const { user, logout } = useAuthSession()
const { notify } = useToast()
const minimumPricePercent = computed({ get: () => Math.round((settings.value.suspiciousMinRatio || 0.2) * 100), set: (value: number) => { settings.value.suspiciousMinRatio = value / 100 } })
async function saveSettings() {
  try { await api('/api/settings', { method: 'PUT', body: settings.value }); persist(); notify('설정을 저장했습니다.') }
  catch { notify('설정을 저장하지 못했습니다.') }
}
</script>

<template>
  <section class="card settings-card"><h3>가격 수집 설정</h3><p>비정상 가격으로 자동 저장하지 않고 검토 대상으로 분류할 기준입니다.</p>
    <div class="setting-field"><label>급격한 가격 인하</label><div><input v-model.number="minimumPricePercent" type="number" min="1" max="99"><span>% 이하이면 검토</span></div><small>예: 기존 100만원 상품이 {{ minimumPricePercent }}만원 이하로 수집된 경우</small></div>
    <div class="setting-field"><label>급격한 가격 인상</label><div><input v-model.number="settings.suspiciousMaxRatio" type="number" min="2" max="20"><span>배 이상이면 검토</span></div><small>예: 기존 100만원 상품이 {{ settings.suspiciousMaxRatio * 100 }}만원 이상으로 수집된 경우</small></div>
    <div class="setting-field"><label>동시 조회 업체 수</label><div><input v-model.number="settings.collectionConcurrency" type="number" min="1" max="7"><span>개씩 조회</span></div><small>사이트 과부하를 피하기 위해 2~3개를 권장합니다.</small></div>
    <div class="settings-actions"><button class="add-button" @click="saveSettings"><Save :size="18"/> 설정 저장</button></div><hr><h3>계정</h3><p>{{ user?.email }}</p><div class="settings-actions"><button class="danger-button" @click="logout"><LogOut :size="18"/> 로그아웃</button></div>
  </section>
</template>
