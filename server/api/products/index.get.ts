import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'
export default defineEventHandler(async event=>{await requireAuth(event);const snapshot=await getAdminFirestore().collection('products').get();return snapshot.docs.map(d=>({id:d.id,...d.data()}))})
