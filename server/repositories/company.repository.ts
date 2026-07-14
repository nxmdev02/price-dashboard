import { FieldValue } from 'firebase-admin/firestore'
import type { CollectionMethod, Platform } from '../../app/types/company'
import { getAdminFirestore } from '../utils/firebase-admin'

export interface SaveCompanyInput {
  id: string
  name: string
  platform: Platform
  defaultCollectionMethod: CollectionMethod
  productUrlTemplate?: string
  selectorConfig?: Record<string, string>
  enabled: boolean
}

const COLLECTION = 'companies'

export async function saveCompany(input: SaveCompanyInput): Promise<void> {
  const reference = getAdminFirestore().collection(COLLECTION).doc(input.id)
  const snapshot = await reference.get()

  await reference.set({
    ...input,
    createdAt: snapshot.exists ? snapshot.get('createdAt') : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}
