import type { Account, Allocation, AnnualLimit, AssetClass, CashflowCategory, CashflowRecord, DcaRecord, Holding, WeeklySnapshot } from '../types'

const BASE = '/api'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const accountApi = {
  getByUserId: (userId: number) =>
    fetchJson<Account[]>(`${BASE}/accounts?userId=${userId}`),

  create: (data: { userId: number; name: string; accountType: string; annualLimit?: number }) =>
    fetchJson<Account>(`${BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getLimits: (accountId: number) =>
    fetchJson<AnnualLimit[]>(`${BASE}/accounts/${accountId}/limits`),

  setLimit: (accountId: number, year: number, annualLimit: number) =>
    fetchJson<AnnualLimit>(`${BASE}/accounts/${accountId}/limits`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, year, annualLimit }),
    }),
}

export const assetClassApi = {
  getAll: () =>
    fetchJson<AssetClass[]>(`${BASE}/asset-classes`),

  getCategories: () =>
    fetchJson<AssetClass[]>(`${BASE}/asset-classes/categories`),

  getAllocations: (userId: number) =>
    fetchJson<Allocation[]>(`${BASE}/asset-classes/allocations?userId=${userId}`),

  setAllocations: (data: { userId: number; allocations: { assetClassId: number; targetRatio: number }[] }) =>
    fetchJson<Allocation[]>(`${BASE}/asset-classes/allocations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
}

export const dcaApi = {
  getByYear: (year: number) =>
    fetchJson<DcaRecord[]>(`${BASE}/dca?year=${year}`),

  getByAccount: (accountId: number) =>
    fetchJson<DcaRecord[]>(`${BASE}/dca?accountId=${accountId}`),

  create: (data: { accountId: number; amount: number; recordDate: string; memo?: string }) =>
    fetchJson<DcaRecord>(`${BASE}/dca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetch(`${BASE}/dca/${id}`, { method: 'DELETE' }),
}

export const holdingApi = {
  getAll: () =>
    fetchJson<Holding[]>(`${BASE}/holdings`),

  getByAccount: (accountId: number) =>
    fetchJson<Holding[]>(`${BASE}/holdings?accountId=${accountId}`),

  create: (data: { accountId: number; assetClassId: number; ticker: string; name: string; currency?: string; quantity?: number; avgPrice?: number }) =>
    fetchJson<Holding>(`${BASE}/holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { quantity?: number; avgPrice?: number; name?: string }) =>
    fetchJson<Holding>(`${BASE}/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
}

export const cashflowApi = {
  getCategories: () =>
    fetchJson<CashflowCategory[]>(`${BASE}/cashflow/categories`),

  getRecords: (userId: number, startDate: string, endDate: string) =>
    fetchJson<CashflowRecord[]>(`${BASE}/cashflow/records?userId=${userId}&startDate=${startDate}&endDate=${endDate}`),

  create: (data: { userId: number; categoryId: number; amount: number; recordDate: string; memo?: string }) =>
    fetchJson<CashflowRecord>(`${BASE}/cashflow/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetch(`${BASE}/cashflow/records/${id}`, { method: 'DELETE' }),
}

export const snapshotApi = {
  getAll: (userId: number) =>
    fetchJson<WeeklySnapshot[]>(`${BASE}/snapshots?userId=${userId}`),

  getByYear: (userId: number, year: number) =>
    fetchJson<WeeklySnapshot[]>(`${BASE}/snapshots?userId=${userId}&year=${year}`),
}
