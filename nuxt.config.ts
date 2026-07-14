// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    firebaseServiceAccountPath: '',
    firebaseProjectId: '',
    firebaseClientEmail: '',
    firebasePrivateKey: '',
    naverClientId: '',
    naverClientSecret: '',
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      firebaseMeasurementId: '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: 'PRICE DASHBOARD',
      meta: [
        { name: 'description', content: '모듈가구 경쟁사 가격 비교 관리자 대시보드' },
        { name: 'theme-color', content: '#f5f4f9' },
      ],
    },
  },
})
