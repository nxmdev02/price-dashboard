const CACHE_KEY = 'price-dashboard:management-cache:v1'

export function useDashboardData() {
  const products = useState<any[]>('dashboard-products', () => [])
  const companies = useState<any[]>('dashboard-companies', () => [])
  const changes = useState<any[]>('dashboard-changes', () => [])
  const settings = useState<any>('dashboard-settings', () => ({ suspiciousMinRatio: 0.2, suspiciousMaxRatio: 5, collectionConcurrency: 3 }))
  const lastCollectedAt = useState<Date | null>('dashboard-last-collected', () => null)
  const loading = useState('dashboard-loading', () => false)
  const { token } = useAuthSession()
  const { notify } = useToast()

  const api = async <T>(url: string, options: any = {}) => $fetch<T>(url, {
    ...options,
    headers: { ...options.headers, authorization: `Bearer ${await token()}` },
  })

  const applyData = (data: any) => {
    products.value = (data.products || []).map((product: any) => ({
      ...product,
      competitors: (product.competitors || []).map((mapping: any) => ({
        ...mapping,
        priceHistories: mapping.priceHistories || [],
        mappingHistories: mapping.mappingHistories || [],
      })),
    }))
    companies.value = data.companies || []
    changes.value = data.changes || []
    settings.value = { ...settings.value, ...data.settings }
    const times = products.value.flatMap(product => product.competitors || [])
      .map(mapping => Date.parse(mapping.latestCheckedAt || ''))
      .filter(Number.isFinite)
    lastCollectedAt.value = times.length ? new Date(Math.max(...times)) : null
  }

  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        products: products.value,
        companies: companies.value,
        changes: changes.value,
        settings: settings.value,
        cachedAt: new Date().toISOString(),
      }))
    } catch { /* 캐시 저장 실패는 화면 동작에 영향을 주지 않습니다. */ }
  }

  const restore = () => {
    if (!import.meta.client) return false
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return false
      applyData(JSON.parse(cached))
      return true
    } catch {
      localStorage.removeItem(CACHE_KEY)
      return false
    }
  }

  const load = async (force = false) => {
    if (!force && products.value.length) { persist(); return }
    if (!force && restore()) return
    loading.value = true
    try {
      const data = await api<any>('/api/management')
      applyData(data)
      persist()
    } catch (error: any) {
      notify(error?.data?.statusMessage || '데이터를 불러오지 못했습니다.')
    } finally {
      loading.value = false
    }
  }

  const allMappings = computed(() => products.value.flatMap(product => (product.competitors || []).map((mapping: any) => ({
    ...mapping,
    productId: product.id,
    modelCode: product.modelCode,
    modelName: product.name,
    modelWidth: product.width,
    modelDepth: product.depth,
    modelHeight: product.height,
    modelDoorCount: product.doorCount,
    imagePath: product.imagePath,
  }))))
  const failedMappings = computed(() => allMappings.value.filter(mapping => ['FAILED', 'REVIEW_REQUIRED'].includes(mapping.lastCollectionStatus)))
  const summary = computed(() => ({
    success: allMappings.value.filter(mapping => mapping.lastCollectionStatus === 'SUCCESS').length,
    failed: failedMappings.value.length,
  }))

  const applyCollectionResult = (productId: string, companyId: string, result: any) => {
    const product = products.value.find(item => item.id === productId)
    const mapping = product?.competitors?.find((item: any) => item.id === companyId)
    if (!product || !mapping || !result || result.status === 'SKIPPED') return product
    const now = new Date().toISOString()
    mapping.latestCheckedAt = now
    mapping.lastCollectionStatus = result.status === 'FAILED' ? 'FAILED' : result.status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'SUCCESS'
    mapping.lastCollectionError = result.message || null
    if (typeof result.price === 'number' && !['FAILED', 'REVIEW_REQUIRED'].includes(result.status)) {
      mapping.latestPrice = result.price
      if (['BASELINE', 'INCREASED', 'DECREASED'].includes(result.status)) {
        mapping.latestChangedAt = now
        const history = { id: `cached-${Date.now()}`, type: result.status === 'BASELINE' ? 'BASELINE' : 'PRICE_CHANGE', price: result.price, previousPrice: result.previousPrice, changeAmount: result.previousPrice == null ? null : result.price - result.previousPrice, changedAt: now, createdAt: now }
        mapping.priceHistories = [...(mapping.priceHistories || []), history]
        if (history.type === 'PRICE_CHANGE') changes.value = [{ ...history, productId, modelCode: product.modelCode, productName: product.name, companyName: mapping.companyName }, ...changes.value].slice(0, 100)
      }
    }
    lastCollectedAt.value = new Date(now)
    persist()
    return product
  }

  return { products, companies, changes, settings, lastCollectedAt, loading, allMappings, failedMappings, summary, api, load, persist, applyCollectionResult }
}
