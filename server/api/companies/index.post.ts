import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event); const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: '경쟁사명은 필수입니다.' })
  const id = String(body.id || body.name).trim().replaceAll('/', '-')
  if (!id) throw createError({ statusCode: 400, statusMessage: '올바른 경쟁사명을 입력해 주세요.' })
  const ref = getAdminFirestore().collection('companies').doc(id)
  if ((await ref.get()).exists) throw createError({ statusCode: 409, statusMessage: '이미 존재하는 경쟁사입니다.' })
  await ref.set({ name: body.name, platform: body.platform || 'OTHER', baseUrl: body.baseUrl || '', defaultCollectionMethod: body.defaultCollectionMethod || 'MANUAL', productUrlTemplate: body.productUrlTemplate || '', enabled: body.enabled !== false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return { id: ref.id }
})
