export type AccountType = 'PENSION_SAVINGS' | 'IRP' | 'ISA' | 'OVERSEAS' | 'GENERAL'

export interface Account {
  id: number
  userId: number
  name: string
  accountType: AccountType
  annualLimit: number | null
  isActive: boolean
}

export interface AssetClass {
  id: number
  name: string
  parentId: number | null
  displayOrder: number
}

export interface Allocation {
  id: number
  userId: number
  assetClassId: number
  assetClassName: string
  parentName: string | null
  targetRatio: number
}

export interface Holding {
  id: number
  accountId: number
  assetClassId: number
  ticker: string
  name: string
  currency: string
}

export interface DcaRecord {
  id: number
  accountId: number
  amount: number
  recordDate: string
  memo: string | null
}
