import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'productId')!
  const body = await readBody(event)
  const allowed = ['name','width','depth','height','doorCount','ownPrice','imagePath','notes','status','enabled']
  const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() }
  for (const key of allowed) if (key in body) update[key] = ['width','depth','height','doorCount','ownPrice'].includes(key) ? (body[key] === '' || body[key] == null ? null : Number(body[key])) : body[key]
  await getAdminFirestore().collection('products').doc(id).update(update)
  return { ok: true }
})
