import type { Account, Allocation, AnnualLimit, AssetClass, BoardComment, BoardRequest, CashAsset, CashflowCategory, CashflowRecord, DcaRecord, Holding, Notice, PageResponse, WeeklySnapshot } from '../types'

const BASE = '/api'

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken')
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken')
}

function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userId')
  localStorage.removeItem('nickname')
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...init, headers })

  if (res.status === 401) {
    // access token 만료 → refresh 시도
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      const retry = await fetch(url, { ...init, headers })
      if (!retry.ok) throw new Error(`${retry.status} ${retry.statusText}`)
      return retry.json()
    } else {
      clearTokens()
      window.location.href = '/login'
      throw new Error('인증이 만료되었습니다')
    }
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchVoid(url: string, init?: RequestInit): Promise<void> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...init, headers })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      const retry = await fetch(url, { ...init, headers })
      if (!retry.ok) throw new Error(`${retry.status} ${retry.statusText}`)
      return
    } else {
      clearTokens()
      window.location.href = '/login'
      throw new Error('인증이 만료되었습니다')
    }
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    saveTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

// --- Auth API ---

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  userId: number
  nickname: string
  isNewUser?: boolean
}

export const authApi = {
  login: (email: string, password: string) =>
    fetchJson<TokenResponse>(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, nickname: string) =>
    fetchJson<TokenResponse>(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    }),

  google: (credential: string) =>
    fetchJson<TokenResponse>(`${BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    }),
}

export const userApi = {
  getMe: () =>
    fetchJson<{ id: number; email: string; nickname: string; isActive: boolean }>(`${BASE}/users/me`),

  setNickname: (nickname: string) =>
    fetchJson<TokenResponse>(`${BASE}/users/me/nickname`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    }),
}

// --- Resource APIs (userId는 서버가 토큰에서 추출) ---

export const accountApi = {
  getMyAccounts: () =>
    fetchJson<Account[]>(`${BASE}/accounts`),

  getById: (id: number) =>
    fetchJson<Account>(`${BASE}/accounts/${id}`),

  create: (data: { name: string; accountType: string; annualLimit?: number }) =>
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

  getAllocations: () =>
    fetchJson<Allocation[]>(`${BASE}/asset-classes/allocations`),

  setAllocations: (data: { allocations: { assetClassId: number; targetRatio: number }[] }) =>
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
    fetchVoid(`${BASE}/dca/${id}`, { method: 'DELETE' }),
}

export const holdingApi = {
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

  getRecords: (startDate: string, endDate: string) =>
    fetchJson<CashflowRecord[]>(`${BASE}/cashflow/records?startDate=${startDate}&endDate=${endDate}`),

  create: (data: { categoryId: number; amount: number; recordDate: string; memo?: string }) =>
    fetchJson<CashflowRecord>(`${BASE}/cashflow/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchVoid(`${BASE}/cashflow/records/${id}`, { method: 'DELETE' }),
}

export const cashAssetApi = {
  getAll: () =>
    fetchJson<CashAsset[]>(`${BASE}/cash-assets`),

  create: (data: { name: string; category: string; balance: number; interestRate?: number; maturityDate?: string; memo?: string }) =>
    fetchJson<CashAsset>(`${BASE}/cash-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { balance?: number; interestRate?: number; name?: string; memo?: string }) =>
    fetchJson<CashAsset>(`${BASE}/cash-assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchVoid(`${BASE}/cash-assets/${id}`, { method: 'DELETE' }),
}

export const snapshotApi = {
  getAll: () =>
    fetchJson<WeeklySnapshot[]>(`${BASE}/snapshots`),

  getByYear: (year: number) =>
    fetchJson<WeeklySnapshot[]>(`${BASE}/snapshots?year=${year}`),
}

// ─── 게시판 ───

export const noticeApi = {
  getAll: (page = 0, size = 10) =>
    fetchJson<PageResponse<Notice>>(`${BASE}/notices?page=${page}&size=${size}`),

  getById: (id: number) =>
    fetchJson<Notice>(`${BASE}/notices/${id}`),

  create: (data: { title: string; content: string; isPinned?: boolean }) =>
    fetchJson<Notice>(`${BASE}/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { title?: string; content?: string; isPinned?: boolean }) =>
    fetchJson<Notice>(`${BASE}/notices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchVoid(`${BASE}/notices/${id}`, { method: 'DELETE' }),
}

export const requestApi = {
  getAll: (params?: { category?: string; status?: string; keyword?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.status) q.set('status', params.status)
    if (params?.keyword) q.set('keyword', params.keyword)
    q.set('page', String(params?.page ?? 0))
    q.set('size', String(params?.size ?? 10))
    return fetchJson<PageResponse<BoardRequest>>(`${BASE}/requests?${q}`)
  },

  getById: (id: number) =>
    fetchJson<BoardRequest>(`${BASE}/requests/${id}`),

  create: (data: { title: string; content: string; category?: string }) =>
    fetchJson<BoardRequest>(`${BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { title?: string; content?: string; category?: string }) =>
    fetchJson<BoardRequest>(`${BASE}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchVoid(`${BASE}/requests/${id}`, { method: 'DELETE' }),

  updateStatus: (id: number, status: string) =>
    fetchJson<BoardRequest>(`${BASE}/requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  vote: (id: number, voteType: string) =>
    fetchJson<BoardRequest>(`${BASE}/requests/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType }),
    }),

  getComments: (id: number) =>
    fetchJson<BoardComment[]>(`${BASE}/requests/${id}/comments`),

  createComment: (id: number, content: string) =>
    fetchJson<BoardComment>(`${BASE}/requests/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId: number) =>
    fetchVoid(`${BASE}/requests/comments/${commentId}`, { method: 'DELETE' }),
}
