import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody(event)
  if (!body?.modelCode || !body?.name) throw createError({ statusCode: 400, statusMessage: '모델 코드와 모델명은 필수입니다.' })
  const id = String(body.modelCode).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const ref = getAdminFirestore().collection('products').doc(id)
  if ((await ref.get()).exists) throw createError({ statusCode: 409, statusMessage: '이미 존재하는 모델 코드입니다.' })
  await ref.set({ modelCode: String(body.modelCode).trim().toUpperCase(), name: String(body.name).trim(), width: Number(body.width) || null, depth: Number(body.depth) || null, height: Number(body.height) || null, doorCount: Number(body.doorCount) || null, ownPrice: Number(body.ownPrice) || null, imagePath: body.imagePath || null, notes: body.notes || null, status: body.status || 'DRAFT', enabled: body.enabled === true, competitorTargetCount: 7, mappedCompetitorCount: 0, unmappedCompanyIds: [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return { id }
})
