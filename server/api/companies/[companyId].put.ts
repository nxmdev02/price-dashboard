import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'
export default defineEventHandler(async event => { await requireAuth(event); const body=await readBody(event); const update:any={updatedAt:FieldValue.serverTimestamp()}; for(const k of ['name','platform','baseUrl','defaultCollectionMethod','productUrlTemplate','enabled']) if(k in body) update[k]=body[k]; await getAdminFirestore().collection('companies').doc(getRouterParam(event,'companyId')!).update(update); return {ok:true} })
