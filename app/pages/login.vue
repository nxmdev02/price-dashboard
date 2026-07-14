<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'
import { signInWithEmailAndPassword } from 'firebase/auth'

definePageMeta({ layout: false })
const email = ref('')
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)
const { user, authReady, initAuth } = useAuthSession()

onMounted(initAuth)
watch([authReady, user], ([ready, value]) => { if (ready && value) void navigateTo('/') }, { immediate: true })

async function login() {
  loginLoading.value = true
  loginError.value = ''
  try {
    await signInWithEmailAndPassword(useNuxtApp().$auth, email.value.trim(), password.value)
    await navigateTo('/')
  } catch {
    loginError.value = '이메일 또는 비밀번호를 확인해 주세요.'
  } finally {
    loginLoading.value = false
  }
}
</script>

<template>
  <div v-if="!authReady" class="auth-splash"><div class="auth-spinner"/><p>로딩중입니다.</p></div>
  <div v-else class="login-page">
    <section class="login-brand-panel" aria-hidden="true"><div class="login-art"><span/><span/><span/><i/><i/></div></section>
    <section class="login-form-panel">
      <form class="login-form" @submit.prevent="login">
        <div class="login-form-brand"><strong class="animated-brand">PRICE DASHBOARD</strong></div>
        <h2>관리자 로그인</h2><p class="login-description">등록된 관리자 계정으로 로그인해 주세요.</p>
        <label><span>이메일</span><input v-model="email" type="email" autocomplete="email" required></label>
        <label><span>비밀번호</span><input v-model="password" type="password" autocomplete="current-password" required></label>
        <p v-if="loginError" class="login-error"><AlertCircle :size="17"/>{{ loginError }}</p>
        <button class="login-button" :disabled="loginLoading">{{ loginLoading ? '로그인 중…' : '로그인' }}</button>
      </form>
    </section>
  </div>
</template>
