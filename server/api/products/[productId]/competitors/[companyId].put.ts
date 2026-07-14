import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../../../../utils/firebase-admin'
import { requireAuth } from '../../../../utils/require-auth'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const productId=getRouterParam(event,'productId')!, companyId=getRouterParam(event,'companyId')!, body=await readBody(event)
  if(!body.productUrl) throw createError({statusCode:400,statusMessage:'상품 URL을 입력해 주세요.'})
  try { const url=new URL(body.productUrl); if(url.protocol!=='https:') throw new Error() } catch { throw createError({statusCode:400,statusMessage:'HTTPS 상품 URL을 입력해 주세요.'}) }
  const db=getAdminFirestore(), productRef=db.collection('products').doc(productId), ref=productRef.collection('competitors').doc(companyId)
  const [before,company]=await Promise.all([ref.get(),db.collection('companies').doc(companyId).get()])
  if(!company.exists) throw createError({statusCode:404,statusMessage:'경쟁사를 찾을 수 없습니다.'})
  const old=before.data() || {}, nextPrice=body.latestPrice === '' || body.latestPrice == null ? null : Number(body.latestPrice)
  if(nextPrice!==null&&(!Number.isFinite(nextPrice)||nextPrice<=0)) throw createError({statusCode:400,statusMessage:'가격은 0보다 큰 숫자여야 합니다.'})
  const externalProductId=String(body.externalProductId||''), productUrl=String(body.productUrl), mappingChanged=before.exists&&(old.externalProductId!==externalProductId||old.productUrl!==productUrl)
  const mappingVersion=mappingChanged?(old.mappingVersion||1)+1:(old.mappingVersion||1)
  const priceChanged=nextPrice!==null&&nextPrice!==old.latestPrice
  const update:Record<string,unknown>={companyId,companyName:company.get('name'),productName:body.productName||old.productName||null,productUrl,externalProductId,urlMode:body.urlMode||'MANUAL',collectionMethod:body.collectionMethod||company.get('defaultCollectionMethod')||'MANUAL',selectorConfig:body.selectorConfig||old.selectorConfig||{},optionConfig:body.optionConfig||old.optionConfig||{},shippingFee:Number(body.shippingFee)||0,optionPrice:Number(body.optionPrice)||0,enabled:body.enabled!==false,mappingVersion,updatedAt:FieldValue.serverTimestamp()}
  if(!before.exists) Object.assign(update,{createdAt:FieldValue.serverTimestamp(),latestPrice:nextPrice,latestCheckedAt:nextPrice?FieldValue.serverTimestamp():null,latestChangedAt:nextPrice?FieldValue.serverTimestamp():null,needsBaseline:!nextPrice,lastCollectionStatus:nextPrice?'SUCCESS':'IDLE',lastCollectionError:null})
  else if(mappingChanged) Object.assign(update,{latestPrice:priceChanged?nextPrice:null,latestCheckedAt:priceChanged?FieldValue.serverTimestamp():null,latestChangedAt:priceChanged?FieldValue.serverTimestamp():null,needsBaseline:!priceChanged,lastCollectionStatus:priceChanged?'SUCCESS':'IDLE',lastCollectionError:null})
  else if(priceChanged) Object.assign(update,{latestPrice:nextPrice,latestCheckedAt:FieldValue.serverTimestamp(),latestChangedAt:FieldValue.serverTimestamp(),needsBaseline:false,lastCollectionStatus:'SUCCESS',lastCollectionError:null})

  const batch=db.batch(); batch.set(ref,update,{merge:true})
  if(mappingChanged) batch.create(ref.collection('mappingHistories').doc(),{previousExternalProductId:old.externalProductId??null,newExternalProductId:externalProductId,previousProductUrl:old.productUrl??null,newProductUrl:productUrl,previousMappingVersion:old.mappingVersion||1,newMappingVersion:mappingVersion,reason:body.changeReason||null,changedAt:FieldValue.serverTimestamp()})
  if(nextPrice&&(!before.exists||priceChanged)) {
    const baseline=!before.exists||mappingChanged||old.needsBaseline===true
    batch.create(ref.collection('priceHistories').doc(),{type:baseline?'BASELINE':'MANUAL_CORRECTION',price:nextPrice,previousPrice:baseline?null:old.latestPrice??null,changeAmount:baseline?null:nextPrice-(old.latestPrice||0),changeRate:baseline||!old.latestPrice?null:((nextPrice-old.latestPrice)/old.latestPrice)*100,productUrl,externalProductId,mappingVersion,changedAt:FieldValue.serverTimestamp(),createdAt:FieldValue.serverTimestamp()})
  }
  await batch.commit()
  const [mappings,companies]=await Promise.all([productRef.collection('competitors').where('enabled','==',true).get(),db.collection('companies').where('enabled','==',true).get()])
  const mappedIds=new Set(mappings.docs.map(d=>d.id)); await productRef.update({mappedCompetitorCount:mappings.size,competitorTargetCount:companies.size,unmappedCompanyIds:companies.docs.map(d=>d.id).filter(id=>!mappedIds.has(id)),updatedAt:FieldValue.serverTimestamp()})
  return {ok:true,mappingChanged,mappingVersion,needsBaseline:Boolean(update.needsBaseline)}
})
