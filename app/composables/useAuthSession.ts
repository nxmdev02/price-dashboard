import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { readonly, ref } from 'vue'

const currentUser = ref<User | null>(null)
const authReady = ref(false)
let listening = false

export function useAuthSession() {
  const initAuth = () => {
    if (!import.meta.client || listening) return
    listening = true
    onAuthStateChanged(useNuxtApp().$auth, (user) => {
      currentUser.value = user
      authReady.value = true
    })
  }

  const token = async () => {
    const value = await useNuxtApp().$auth.currentUser?.getIdToken()
    if (!value) throw new Error('로그인이 필요합니다.')
    return value
  }

  const logout = async () => {
    await firebaseSignOut(useNuxtApp().$auth)
    await navigateTo('/login')
  }

  return { user: readonly(currentUser), authReady: readonly(authReady), initAuth, token, logout }
}
