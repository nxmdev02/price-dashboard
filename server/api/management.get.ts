import { getAdminFirestore } from '../utils/firebase-admin'
import { requireAuth } from '../utils/require-auth'

function iso(value: any) { return value?.toDate?.().toISOString() ?? null }

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = getAdminFirestore()
  const [productSnap, companySnap, settingsSnap] = await Promise.all([
    db.collection('products').get(), db.collection('companies').get(), db.collection('settings').doc('general').get(),
  ])
  const companies = companySnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: iso(d.get('createdAt')), updatedAt: iso(d.get('updatedAt')) }))
  const products = await Promise.all(productSnap.docs.map(async d => {
    const mappings = await d.ref.collection('competitors').get()
    return { id: d.id, ...d.data(), createdAt: iso(d.get('createdAt')), updatedAt: iso(d.get('updatedAt')), competitors: mappings.docs.map(m => ({ id: m.id, ...m.data(), latestCheckedAt: iso(m.get('latestCheckedAt')), latestChangedAt: iso(m.get('latestChangedAt')) })) }
  }))
  products.sort((a: any, b: any) => String(a.modelCode).localeCompare(String(b.modelCode), 'en', { numeric: true }))

  return { products, companies, changes: [], settings: settingsSnap.exists ? settingsSnap.data() : { suspiciousMinRatio: 0.2, suspiciousMaxRatio: 5, collectionConcurrency: 3 } }
})
