import { readFile } from 'node:fs/promises'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { load } from 'cheerio'

const account=JSON.parse(await readFile('./firebase-service-account.json','utf8'))
initializeApp({credential:cert(account)})
const db=getFirestore()
const products=await db.collection('products').get()
const byCode=new Map(products.docs.map(document=>[document.get('modelCode'),document]))

const manual=new Map()
const csv=await readFile('./data/templates/naver-manual-prices.csv','utf8')
for(const line of csv.split(/\r?\n/).slice(1)){
  if(!line.trim())continue
  const [modelCode,companyName,,,productName]=line.split(',')
  const companyId={디스플레이룸:'displayroom',홈츠라이프:'homezlife',LBB:'lbbstudio'}[companyName]
  if(companyId)manual.set(`${modelCode}:${companyId}`,productName)
}
manual.set('MODEL-001:homezlife','고급형 모듈가구 철제 수납장 침대 틈새 협탁 사이드테이블 A타입 화이트')
manual.set('MODEL-001:lbbstudio','LBB modular SIDE TABLE 침대협탁')
manual.set('MODEL-002:displayroom','미드센츄리 협탁 모듈 S급 고급형 철제수납장 사이드 침대옆 VN1')

for(const [key,productName] of manual){
  const [modelCode,companyId]=key.split(':'), product=byCode.get(modelCode)
  if(product)await product.ref.collection('competitors').doc(companyId).update({productName,updatedAt:FieldValue.serverTimestamp()})
}

const tasks=[]
for(const product of products.docs){
  const mappings=await product.ref.collection('competitors').get()
  for(const mapping of mappings.docs){
    if(mapping.get('collectionMethod')==='MANUAL'||!mapping.get('productUrl'))continue
    tasks.push(async()=>{
      try{
        const response=await fetch(mapping.get('productUrl'),{headers:{'user-agent':'Mozilla/5.0 Chrome/126 Safari/537.36','accept-language':'ko-KR,ko;q=0.9'},signal:AbortSignal.timeout(15000)})
        if(!response.ok)return false
        const contentType=response.headers.get('content-type')||'',charset=contentType.match(/charset=([^;]+)/i)?.[1]||'utf-8'
        const html=new TextDecoder(charset).decode(await response.arrayBuffer()),$=load(html)
        const selector=mapping.get('selectorConfig.productNameSelector')||'meta[property="og:title"]'
        const element=$(selector).first(),productName=(element.attr('content')||element.text()||$('meta[property="og:title"]').attr('content')||$('h2').first().text()).trim()
        if(!productName)return false
        await mapping.ref.update({productName,updatedAt:FieldValue.serverTimestamp()})
        return true
      }catch{return false}
    })
  }
}
let cursor=0,success=0
async function worker(){while(cursor<tasks.length){const task=tasks[cursor++];if(await task())success++}}
await Promise.all(Array.from({length:4},worker))
console.log(JSON.stringify({manual:manual.size,automaticTotal:tasks.length,automaticUpdated:success}))
