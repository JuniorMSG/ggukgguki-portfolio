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
  quantity: number
  avgPrice: number
  totalAmount: number
}

export interface CashAsset {
  id: number
  name: string
  category: 'FIXED' | 'LIQUID'
  balance: number
  interestRate: number
  maturityDate: string | null
  memo: string | null
}

export interface WeeklySnapshot {
  id: number
  weekLabel: string
  startDate: string
  endDate: string
  totalCapital: number
  totalInvestment: number
  capitalGrowthRate: number
  investmentGrowthRate: number
  investedPlusCash: number
  totalDividend: number
  returnRate: number
  returnRateTr: number
  acctOverseas: number
  acctDomestic: number
  acctIrp: number
  acctPension1: number
  acctPension2: number
  acctIsa: number
  acctCash: number
  weeklyChange: number
  weeklyDividend: number
  assetGrowth: number
  assetDividend: number
  assetBond: number
  assetCash: number
  assetDomestic: number
  exchangeRate: number
}

export interface AnnualLimit {
  id: number
  accountId: number
  year: number
  annualLimit: number
}

export type FlowType = 'INCOME' | 'EXPENSE'

export interface CashflowCategory {
  id: number
  name: string
  flowType: FlowType
  parentId: number | null
  displayOrder: number
}

export interface CashflowRecord {
  id: number
  userId: number
  categoryId: number
  categoryName: string
  flowType: FlowType
  parentName: string | null
  amount: number
  recordDate: string
  memo: string | null
}

export interface DcaRecord {
  id: number
  accountId: number
  amount: number
  recordDate: string
  memo: string | null
}
