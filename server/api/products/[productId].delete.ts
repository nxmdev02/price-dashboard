import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const ref = getAdminFirestore().collection('products').doc(getRouterParam(event, 'productId')!)
  await getAdminFirestore().recursiveDelete(ref)
  return { ok: true }
})
