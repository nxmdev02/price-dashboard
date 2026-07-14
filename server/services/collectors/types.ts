import type { CollectionMethod } from '../../../app/types/company'

export interface CollectPriceOptions {
  url: string
  method: CollectionMethod
  externalProductId?: string
  selectorConfig?: Record<string, unknown>
  optionConfig?: Record<string, unknown>
}

export interface CollectedPrice {
  productName?: string
  listPrice?: number
  salePrice?: number
  couponPrice?: number
  shippingFee?: number
  optionPrice?: number
  finalPrice: number
  rawData?: Record<string, unknown>
}

export interface PriceCollector {
  supports(options: CollectPriceOptions): boolean
  collect(options: CollectPriceOptions): Promise<CollectedPrice>
}
