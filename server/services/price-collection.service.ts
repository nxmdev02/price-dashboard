import { FieldValue } from 'firebase-admin/firestore'
import { collectPrice } from './collectors'
import { getAdminFirestore } from '../utils/firebase-admin'

interface CollectionResult {
  companyId: string
  companyName: string
  status: 'UNCHANGED' | 'INCREASED' | 'DECREASED' | 'BASELINE' | 'SKIPPED' | 'FAILED' | 'REVIEW_REQUIRED'
  previousPrice: number | null
  price: number | null
  message?: string
}

function isSuspicious(previousPrice: number, nextPrice: number, minRatio: number, maxRatio: number): boolean {
  const ratio = nextPrice / previousPrice
  return ratio < minRatio || ratio > maxRatio
}

export async function collectProductPrices(productId: string, companyId?: string): Promise<CollectionResult[]> {
  const db = getAdminFirestore()
  const productRef = db.collection('products').doc(productId)
  const product = await productRef.get()
  if (!product.exists) throw createError({ statusCode: 404, statusMessage: '모델을 찾을 수 없습니다.' })

  const settings = (await db.collection('settings').doc('general').get()).data() ?? {}
  const suspiciousMinRatio = typeof settings.suspiciousMinRatio === 'number' ? settings.suspiciousMinRatio : 0.2
  const suspiciousMaxRatio = typeof settings.suspiciousMaxRatio === 'number' ? settings.suspiciousMaxRatio : 5
  const collectionConcurrency = Math.min(7, Math.max(1, typeof settings.collectionConcurrency === 'number' ? settings.collectionConcurrency : 3))

  const competitorDocuments = companyId
    ? [await productRef.collection('competitors').doc(companyId).get()].filter(document => document.exists && document.get('enabled') === true)
    : (await productRef.collection('competitors').where('enabled', '==', true).limit(7).get()).docs
  if (companyId && !competitorDocuments.length) throw createError({ statusCode: 404, statusMessage: '활성 경쟁사 매핑을 찾을 수 없습니다.' })
  const tasks = competitorDocuments.map(document => async (): Promise<CollectionResult> => {
    const mapping = document.data()!
    const companyName = mapping.companyName ?? document.id
    if (mapping.collectionMethod === 'MANUAL') {
      return { companyId: document.id, companyName, status: 'SKIPPED', previousPrice: mapping.latestPrice ?? null, price: mapping.latestPrice ?? null, message: '수동 관리 상품' }
    }

    try {
      const company = await db.collection('companies').doc(document.id).get()
      const companyConfig = company.data() ?? {}
      const collected = await collectPrice({
        url: mapping.productUrl,
        method: mapping.collectionMethod,
        externalProductId: mapping.externalProductId,
        selectorConfig: { ...(companyConfig.selectorConfig ?? {}), ...(mapping.selectorConfig ?? {}) },
        optionConfig: mapping.optionConfig,
      })
      const shippingFee = typeof mapping.shippingFee === 'number' ? mapping.shippingFee : 0
      const optionPrice = typeof mapping.optionPrice === 'number' ? mapping.optionPrice : 0
      const nextPrice = collected.finalPrice + shippingFee + optionPrice
      const previousPrice = typeof mapping.latestPrice === 'number' ? mapping.latestPrice : null

      if (previousPrice && isSuspicious(previousPrice, nextPrice, suspiciousMinRatio, suspiciousMaxRatio)) {
        await document.ref.update({ lastCollectionStatus: 'REVIEW_REQUIRED', lastCollectionError: '기존 가격 대비 비정상적인 변동이 감지되었습니다.', latestCheckedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
        return { companyId: document.id, companyName, status: 'REVIEW_REQUIRED', previousPrice, price: nextPrice }
      }

      let status: CollectionResult['status'] = 'UNCHANGED'
      await db.runTransaction(async transaction => {
        const fresh = await transaction.get(document.ref)
        const data = fresh.data() ?? mapping
        const currentPrice = typeof data.latestPrice === 'number' ? data.latestPrice : null
        const needsBaseline = data.needsBaseline === true || currentPrice === null
        const update: Record<string, unknown> = {
          latestCheckedAt: FieldValue.serverTimestamp(), lastCollectionStatus: 'SUCCESS', lastCollectionError: null,
          listPrice: collected.listPrice ?? data.listPrice ?? null, salePrice: collected.salePrice ?? collected.finalPrice,
          shippingFee, optionPrice, updatedAt: FieldValue.serverTimestamp(),
        }

        if (needsBaseline) {
          status = 'BASELINE'
          update.latestPrice = nextPrice
          update.latestChangedAt = FieldValue.serverTimestamp()
          update.needsBaseline = false
          const history = document.ref.collection('priceHistories').doc()
          transaction.create(history, { type: 'BASELINE', price: nextPrice, previousPrice: null, changeAmount: null, changeRate: null, externalProductId: data.externalProductId, productUrl: data.productUrl, mappingVersion: data.mappingVersion ?? 1, changedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() })
        } else if (currentPrice !== nextPrice) {
          status = nextPrice > currentPrice ? 'INCREASED' : 'DECREASED'
          update.latestPrice = nextPrice
          update.latestChangedAt = FieldValue.serverTimestamp()
          const history = document.ref.collection('priceHistories').doc()
          transaction.create(history, { type: 'PRICE_CHANGE', price: nextPrice, previousPrice: currentPrice, changeAmount: nextPrice - currentPrice, changeRate: currentPrice === 0 ? null : ((nextPrice - currentPrice) / currentPrice) * 100, externalProductId: data.externalProductId, productUrl: data.productUrl, mappingVersion: data.mappingVersion ?? 1, changedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() })
        }
        transaction.update(document.ref, update)
      })
      return { companyId: document.id, companyName, status, previousPrice, price: nextPrice }
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 가격 수집 오류'
      await document.ref.update({ lastCollectionStatus: 'FAILED', lastCollectionError: message, latestCheckedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      return { companyId: document.id, companyName, status: 'FAILED', previousPrice: mapping.latestPrice ?? null, price: null, message }
    }
  })

  const results: CollectionResult[] = []
  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++
      results[index] = await tasks[index]!()
    }
  }
  await Promise.all(Array.from({ length: Math.min(collectionConcurrency, tasks.length) }, worker))
  return results
}
