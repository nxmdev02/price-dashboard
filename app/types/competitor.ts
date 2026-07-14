import type { CollectionMethod } from './company'

export type CollectionStatus = 'IDLE' | 'SUCCESS' | 'FAILED' | 'REVIEW_REQUIRED'

export interface ProductCompetitor {
  companyId: string
  companyName: string
  externalProductId: string
  productUrl: string
  urlMode: 'AUTO' | 'MANUAL'
  collectionMethod: CollectionMethod
  selectorConfig?: Record<string, unknown>
  optionConfig?: Record<string, unknown>
  latestPrice: number | null
  latestCheckedAt: string | null
  latestChangedAt: string | null
  mappingVersion: number
  needsBaseline: boolean
  lastCollectionStatus: CollectionStatus
  lastCollectionError?: string | null
  enabled: boolean
}
