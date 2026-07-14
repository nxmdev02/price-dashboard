import { getAdminFirestore } from '../../utils/firebase-admin'
import { requireAuth } from '../../utils/require-auth'
export default defineEventHandler(async event=>{await requireAuth(event);const document=await getAdminFirestore().collection('products').doc(getRouterParam(event,'productId')!).get();if(!document.exists)throw createError({statusCode:404,statusMessage:'모델을 찾을 수 없습니다.'});return{id:document.id,...document.data()}})
