export type AccountType = 'PENSION_SAVINGS' | 'IRP' | 'ISA' | 'OVERSEAS' | 'GENERAL'

export interface Account {
  id: number
  userId: number
  name: string
  accountType: AccountType
  annualLimit: number | null
  isActive: boolean
}

export interface DcaRecord {
  id: number
  accountId: number
  amount: number
  recordDate: string
  memo: string | null
}
