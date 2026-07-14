import { readFile } from 'node:fs/promises'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const COMPANY_IDS = { '홈츠라이프': 'homezlife', '디스플레이룸': 'displayroom', 'LBB': 'lbbstudio' }
const csvPath = process.argv[2] ?? './data/templates/naver-manual-prices.csv'
const account = JSON.parse(await readFile('./firebase-service-account.json', 'utf8'))
initializeApp({ credential: cert(account) })
const db = getFirestore()
const lines = (await readFile(csvPath, 'utf8')).trim().split(/\r?\n/)
const headers = lines.shift().split(',')
const rows = lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value.trim()])))

for (const row of rows) {
  const companyId = COMPANY_IDS[row.companyName]
  if (!companyId) throw new Error(`지원하지 않는 회사입니다: ${row.companyName}`)
  const listPrice = Number(row.listPrice)
  const salePrice = Number(row.salePrice)
  const shippingFee = Number(row.shippingFee)
  const optionPrice = Number(row.optionPrice)
  const finalPrice = salePrice + shippingFee + optionPrice
  if (![listPrice, salePrice, shippingFee, optionPrice, finalPrice].every(Number.isFinite) || finalPrice <= 0) {
    throw new Error(`${row.modelCode}/${row.companyName}의 가격이 올바르지 않습니다.`)
  }

  const competitorRef = db.collection('products').doc(row.modelCode.toLowerCase()).collection('competitors').doc(companyId)
  const historyRef = competitorRef.collection('priceHistories').doc('baseline-v1')
  await db.runTransaction(async transaction => {
    const [competitor, history] = await Promise.all([transaction.get(competitorRef), transaction.get(historyRef)])
    transaction.set(competitorRef, {
      companyId, companyName: row.companyName, externalProductId: row.productId, productUrl: row.productUrl,
      productName: row.productName, urlMode: 'AUTO', collectionMethod: 'MANUAL', listPrice, salePrice,
      shippingFee, optionPrice, latestPrice: finalPrice, latestCheckedAt: FieldValue.serverTimestamp(),
      latestChangedAt: FieldValue.serverTimestamp(), mappingVersion: competitor.exists ? competitor.get('mappingVersion') ?? 1 : 1,
      needsBaseline: false, lastCollectionStatus: 'SUCCESS', lastCollectionError: null, enabled: true,
      createdAt: competitor.exists ? competitor.get('createdAt') : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    if (!history.exists) transaction.create(historyRef, {
      type: 'BASELINE', price: finalPrice, previousPrice: null, changeAmount: null, changeRate: null,
      externalProductId: row.productId, productUrl: row.productUrl, mappingVersion: 1,
      priceComponents: { listPrice, salePrice, shippingFee, optionPrice },
      changedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(),
    })
  })
  console.log(`${row.modelCode} / ${row.companyName}: ${finalPrice}`)
}

console.log(`Imported ${rows.length} manual price baselines`)
