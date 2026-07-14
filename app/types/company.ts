export type Platform = 'NAVER_SMARTSTORE' | 'CAFE24' | 'OWN_MALL' | 'OTHER'

export type CollectionMethod =
  | 'NAVER_SEARCH_API'
  | 'CAFE24_API'
  | 'JSON_LD'
  | 'HTML_SELECTOR'
  | 'PLAYWRIGHT'
  | 'MANUAL'

export interface Company {
  id: string
  name: string
  platform: Platform
  defaultCollectionMethod: CollectionMethod
  productUrlTemplate?: string
  selectorConfig?: Record<string, string>
  enabled: boolean
  createdAt: string
  updatedAt: string
}
