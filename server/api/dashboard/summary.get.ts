import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  return null
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = getAdminFirestore()
  const [productsSnapshot, companiesSnapshot] = await Promise.all([
    db.collection('products').get(),
    db.collection('companies').where('enabled', '==', true).get(),
  ])

  const products = await Promise.all(productsSnapshot.docs.map(async (document) => {
    const product = document.data()
    const competitors = await document.ref.collection('competitors').where('enabled', '==', true).get()
    const rows = competitors.docs.map(item => item.data())
    const prices = rows.map(item => item.latestPrice).filter((value): value is number => typeof value === 'number' && value > 0)
    const successCount = rows.filter(item => item.lastCollectionStatus === 'SUCCESS').length
    const failedCount = rows.filter(item => item.lastCollectionStatus === 'FAILED').length
    const reviewCount = rows.filter(item => item.lastCollectionStatus === 'REVIEW_REQUIRED').length
    const checkedTimes = rows.map(item => toIso(item.latestCheckedAt)).filter((value): value is string => Boolean(value)).sort()

    return {
      id: document.id,
      modelCode: product.modelCode ?? document.id.toUpperCase(),
      name: product.name ?? document.id,
      ownPrice: typeof product.ownPrice === 'number' ? product.ownPrice : null,
      width: product.width ?? null,
      depth: product.depth ?? null,
      height: product.height ?? null,
      doorCount: product.doorCount ?? null,
      imagePath: product.imagePath ?? null,
      competitorTargetCount: product.competitorTargetCount ?? 7,
      mappedCompetitorCount: product.mappedCompetitorCount ?? competitors.size,
      successCount,
      failedCount,
      reviewCount,
      unmappedCount: Array.isArray(product.unmappedCompanyIds) ? product.unmappedCompanyIds.length : 0,
      lowestPrice: prices.length ? Math.min(...prices) : null,
      highestPrice: prices.length ? Math.max(...prices) : null,
      averagePrice: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : null,
      latestCheckedAt: checkedTimes.at(-1) ?? null,
    }
  }))

  products.sort((a, b) => a.modelCode.localeCompare(b.modelCode, 'en', { numeric: true }))
  const successfulMappings = products.reduce((sum, product) => sum + product.successCount, 0)
  const failedMappings = products.reduce((sum, product) => sum + product.failedCount, 0)
  const reviewMappings = products.reduce((sum, product) => sum + product.reviewCount, 0)

  return {
    summary: {
      productCount: products.length,
      companyCount: companiesSnapshot.size,
      successfulMappings,
      failedMappings,
      reviewMappings,
      mappedMappings: products.reduce((sum, product) => sum + product.mappedCompetitorCount, 0),
      targetMappings: products.reduce((sum, product) => sum + product.competitorTargetCount, 0),
    },
    products,
  }
})
