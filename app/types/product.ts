export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface Product {
  id: string
  modelCode: string
  name: string
  ownPrice: number | null
  width?: number
  depth?: number
  height?: number
  doorType?: string
  status: ProductStatus
  enabled: boolean
  createdAt: string
  updatedAt: string
}
