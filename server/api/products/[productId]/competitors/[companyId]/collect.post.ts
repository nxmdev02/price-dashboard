import { collectProductPrices } from '../../../../../services/price-collection.service'
import { requireAuth } from '../../../../../utils/require-auth'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const productId=getRouterParam(event,'productId'), companyId=getRouterParam(event,'companyId')
  if(!productId||!companyId) throw createError({statusCode:400,statusMessage:'모델과 경쟁사 ID가 필요합니다.'})
  const results=await collectProductPrices(productId,companyId)
  return {result:results[0]}
})
