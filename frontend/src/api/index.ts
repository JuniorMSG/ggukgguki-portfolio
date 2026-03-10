import type { Account, DcaRecord } from '../types'

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
}
