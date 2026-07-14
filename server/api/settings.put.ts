import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../utils/firebase-admin'
import { requireAuth } from '../utils/require-auth'
export default defineEventHandler(async event => { await requireAuth(event); const b=await readBody(event); const data={suspiciousMinRatio:Number(b.suspiciousMinRatio)||0.2,suspiciousMaxRatio:Number(b.suspiciousMaxRatio)||5,collectionConcurrency:Math.min(7,Math.max(1,Number(b.collectionConcurrency)||3)),updatedAt:FieldValue.serverTimestamp()}; await getAdminFirestore().collection('settings').doc('general').set(data,{merge:true}); return {ok:true} })
