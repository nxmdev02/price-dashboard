<script setup lang="ts">
import { LogOut, Menu } from '@lucide/vue'

const route = useRoute()
const mobileMenu = ref(false)
const { user, authReady, initAuth, logout } = useAuthSession()
const { failedMappings, load } = useDashboardData()
const { toast } = useToast()

const nav = [
  { to: '/', label: '홈' },
  { to: '/models', label: '모델 관리' },
  { to: '/competitors', label: '경쟁사 관리' },
  { to: '/price-comparison', label: '가격 비교' },
  { to: '/errors', label: '오류 관리' },
  { to: '/settings', label: '설정' },
]

const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)

onMounted(initAuth)
watch([authReady, user], ([ready, value]) => {
  if (!ready) return
  if (!value) void navigateTo('/login')
  else void load()
}, { immediate: true })
watch(() => route.path, () => { mobileMenu.value = false })
</script>

<template>
  <div v-if="!authReady" class="auth-splash"><div class="auth-spinner"/><p>로딩중입니다.</p></div>
  <div v-else-if="user" class="app-shell">
    <div class="mobile-top">
      <NuxtLink class="brand animated-brand" to="/">PRICE DASHBOARD</NuxtLink>
      <button class="icon-button" aria-label="메뉴 열기" @click="mobileMenu = !mobileMenu"><Menu :size="24"/></button>
    </div>
    <aside class="sidebar" :class="{ open: mobileMenu }">
      <div>
        <NuxtLink class="brand animated-brand" to="/">PRICE DASHBOARD</NuxtLink>
        <nav>
          <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" :class="{ active: isActive(item.to) }">
            {{ item.label }}<span v-if="item.to === '/errors' && failedMappings.length" class="count">{{ failedMappings.length }}</span>
          </NuxtLink>
        </nav>
      </div>
      <div class="side-bottom"><button class="logout-button" title="로그아웃" @click="logout"><LogOut :size="21"/><span>로그아웃</span></button></div>
    </aside>
    <button v-if="mobileMenu" class="sidebar-dim" aria-label="사이드바 닫기" @click="mobileMenu = false"/>
    <main><slot/></main>
    <Transition name="toast"><div v-if="toast" class="toast">{{ toast }}</div></Transition>
  </div>
</template>
