export type PriceHistoryType = 'BASELINE' | 'PRICE_CHANGE' | 'MANUAL_CORRECTION'

export interface PriceHistory {
  type: PriceHistoryType
  price: number
  previousPrice: number | null
  changeAmount: number | null
  changeRate: number | null
  externalProductId: string
  productUrl: string
  mappingVersion: number
  changedAt: string
  createdAt: string
}
