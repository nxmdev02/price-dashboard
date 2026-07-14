import { collectProductPrices } from '../../../services/price-collection.service'
import { requireAuth } from '../../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, statusMessage: '모델 ID가 필요합니다.' })
  const results = await collectProductPrices(productId)
  return {
    results,
    summary: {
      total: results.length,
      changed: results.filter(result => result.status === 'INCREASED' || result.status === 'DECREASED').length,
      unchanged: results.filter(result => result.status === 'UNCHANGED').length,
      skipped: results.filter(result => result.status === 'SKIPPED').length,
      failed: results.filter(result => result.status === 'FAILED').length,
      reviewRequired: results.filter(result => result.status === 'REVIEW_REQUIRED').length,
    },
  }
})
