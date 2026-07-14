import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'
export default defineEventHandler(async event => {
  await requireAuth(event)
  const id=getRouterParam(event,'companyId')!, db=getAdminFirestore(), products=await db.collection('products').get()
  for (const product of products.docs) {
    if ((await product.ref.collection('competitors').doc(id).get()).exists) throw createError({statusCode:409,statusMessage:'모델에 연결된 경쟁사는 삭제할 수 없습니다. 비활성화해 주세요.'})
  }
  await db.collection('companies').doc(id).delete()
  return {ok:true}
})
