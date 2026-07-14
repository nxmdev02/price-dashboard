import { readFile } from 'node:fs/promises'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { load } from 'cheerio'

const COMPANY_IDS = {
  '더리움': 'thereum',
  '디엘로': 'deello',
  '듈': 'duul',
  '데프트': 'deft',
  '홈츠라이프': 'homezlife',
  '디스플레이룸': 'displayroom',
  'LBB': 'lbbstudio',
}

const NAVER_COMPANIES = new Set(['홈츠라이프', '디스플레이룸', 'LBB'])
const sourcePath = process.argv[2]
if (!sourcePath) throw new Error('사용법: node scripts/import-competitor-mappings.mjs <목록.txt>')

const account = JSON.parse(await readFile('./firebase-service-account.json', 'utf8'))
initializeApp({ credential: cert(account) })
const db = getFirestore()

function parseInput(text) {
  const models = []
  let current
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (/^MODEL-\d{3}$/.test(line)) {
      current = { modelCode: line, mappings: [] }
      models.push(current)
      continue
    }
    if (!current) continue
    const separator = line.indexOf(':')
    if (separator < 0) continue
    current.mappings.push({ companyName: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() })
  }
  return models
}

function price(value) {
  if (!value) return null
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

function productId(url, companyName) {
  const parsed = new URL(url)
  if (NAVER_COMPANIES.has(companyName)) return parsed.pathname.match(/products\/(\d+)/)?.[1]
  if (companyName === '더리움') return parsed.pathname.match(/\/(\d+)\/category/)?.[1]
  if (companyName === '디엘로') return parsed.searchParams.get('pno')
  return parsed.searchParams.get('product_no')
}

async function collect(url, companyName) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'accept-language': 'ko-KR,ko;q=0.9' },
    signal: AbortSignal.timeout(25_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const html = await response.text()
  const $ = load(html)
  let productName = $('meta[property="og:title"]').attr('content')?.trim() ?? $('h2').first().text().trim()
  let listPrice
  let salePrice
  let shippingFee = 0

  if (companyName === '디엘로') {
    productName = $('h2').first().text().trim() || productName
    listPrice = price($('div.price span.consumer').first().text())
    salePrice = price($('div.price span.sell strong').first().text())
    const seoulShipping = html.match(/서울\/수도권[^:]*::([0-9.]+)::/i)?.[1]
    shippingFee = price(seoulShipping) ?? 0
  } else {
    listPrice = price($('meta[property="product:price:amount"]').attr('content') ?? $('#span_product_price_text').first().text())
    salePrice = price($('#span_product_price_sale').first().text()) ?? listPrice
    const shippingText = $('.delv_price_B').first().text().trim()
    if (shippingText && !shippingText.includes('무료')) shippingFee = price(shippingText) ?? 0
  }

  if (!salePrice) throw new Error('판매가를 찾지 못했습니다.')
  return { productName, listPrice: listPrice ?? salePrice, salePrice, shippingFee, optionPrice: 0, finalPrice: salePrice + shippingFee }
}

async function saveMapping(modelCode, companyName, url, collected) {
  const productIdValue = productId(url, companyName)
  if (!productIdValue) throw new Error('상품 ID를 찾지 못했습니다.')
  const companyId = COMPANY_IDS[companyName]
  const competitorRef = db.collection('products').doc(modelCode.toLowerCase()).collection('competitors').doc(companyId)
  const historyRef = competitorRef.collection('priceHistories').doc('baseline-v1')
  const current = await competitorRef.get()

  if (!collected) {
    await competitorRef.set({
      companyId, companyName, externalProductId: productIdValue, productUrl: url, urlMode: 'AUTO', collectionMethod: 'MANUAL',
      latestPrice: null, latestCheckedAt: null, latestChangedAt: null, mappingVersion: 1, needsBaseline: true,
      lastCollectionStatus: 'REVIEW_REQUIRED', lastCollectionError: '네이버 스마트스토어 수동 가격 확인 필요', enabled: true,
      createdAt: current.exists ? current.get('createdAt') : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    return
  }

  await db.runTransaction(async (transaction) => {
    const history = await transaction.get(historyRef)
    transaction.set(competitorRef, {
      companyId, companyName, externalProductId: productIdValue, productName: collected.productName, productUrl: url, urlMode: 'AUTO',
      collectionMethod: 'HTML_SELECTOR', listPrice: collected.listPrice, salePrice: collected.salePrice,
      shippingFee: collected.shippingFee, optionPrice: collected.optionPrice, latestPrice: collected.finalPrice,
      latestCheckedAt: FieldValue.serverTimestamp(), latestChangedAt: FieldValue.serverTimestamp(), mappingVersion: 1,
      needsBaseline: false, lastCollectionStatus: 'SUCCESS', lastCollectionError: null, enabled: true,
      createdAt: current.exists ? current.get('createdAt') : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    if (!history.exists) transaction.create(historyRef, {
      type: 'BASELINE', price: collected.finalPrice, previousPrice: null, changeAmount: null, changeRate: null,
      externalProductId: productIdValue, productUrl: url, mappingVersion: 1,
      priceComponents: { listPrice: collected.listPrice, salePrice: collected.salePrice, shippingFee: collected.shippingFee, optionPrice: 0 },
      changedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(),
    })
  })
}

async function runPool(tasks, concurrency = 3) {
  const results = []
  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++
      try { results[index] = await tasks[index]() }
      catch (error) { results[index] = { ok: false, error: error instanceof Error ? error.message : String(error) } }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

const models = parseInput(await readFile(sourcePath, 'utf8'))
const tasks = []
for (const model of models) {
  const unmappedCompanyIds = []
  let mappedCount = 0
  for (const mapping of model.mappings) {
    if (!(mapping.companyName in COMPANY_IDS)) continue
    if (mapping.value === '없음') {
      unmappedCompanyIds.push(COMPANY_IDS[mapping.companyName])
      continue
    }
    mappedCount++
    tasks.push(async () => {
      try {
        const collected = NAVER_COMPANIES.has(mapping.companyName) ? null : await collect(mapping.value, mapping.companyName)
        await saveMapping(model.modelCode, mapping.companyName, mapping.value, collected)
        return { ok: true, model: model.modelCode, company: mapping.companyName, price: collected?.finalPrice ?? null, manual: !collected }
      } catch (error) {
        return { ok: false, model: model.modelCode, company: mapping.companyName, error: error instanceof Error ? error.message : String(error) }
      }
    })
  }
  await db.collection('products').doc(model.modelCode.toLowerCase()).set({
    competitorTargetCount: 7, mappedCompetitorCount: mappedCount, unmappedCompanyIds, updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

const results = await runPool(tasks)
const success = results.filter(result => result?.ok)
const failed = results.filter(result => result && !result.ok)
console.log(JSON.stringify({ models: models.length, mappings: tasks.length, success: success.length, automatic: success.filter(x => !x.manual).length, manual: success.filter(x => x.manual).length, failed }, null, 2))
