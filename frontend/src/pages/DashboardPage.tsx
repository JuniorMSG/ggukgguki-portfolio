import { useEffect, useState } from 'react'
import { accountApi, assetClassApi, dcaApi } from '../api'
import type { Account, Allocation, DcaRecord } from '../types'

const USER_ID = 1

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [dcaRecords, setDcaRecords] = useState<DcaRecord[]>([])
  const year = new Date().getFullYear()

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    assetClassApi.getAllocations(USER_ID).then(setAllocations).catch(() => {})
    dcaApi.getByYear(year).then(setDcaRecords)
  }, [year])

  const totalInvested = dcaRecords.reduce((sum, r) => sum + r.amount, 0)
  const totalLimit = accounts.reduce((sum, a) => sum + (a.annualLimit || 0), 0)

  const getDcaTotal = (accountId: number) =>
    dcaRecords.filter((r) => r.accountId === accountId).reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500">계좌 수</p>
          <p className="text-2xl font-bold text-gray-800">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500">{year}년 투자</p>
          <p className="text-2xl font-bold text-blue-600">{totalInvested.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500">한도 소진</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalLimit > 0 ? Math.round((totalInvested / totalLimit) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 자산 비중 */}
      {allocations.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-3">목표 자산 비중</h2>
          <div className="flex rounded-full h-5 overflow-hidden">
            {allocations.map((alloc, i) => {
              if (alloc.targetRatio === 0) return null
              const total = allocations.reduce((s, a) => s + a.targetRatio, 0)
              return (
                <div
                  key={alloc.id}
                  className="h-full"
                  style={{
                    width: `${(alloc.targetRatio / total) * 100}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {allocations.map((alloc, i) => (
              <span key={alloc.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {alloc.assetClassName} {alloc.targetRatio}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 계좌별 현황 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3">계좌별 현황</h2>
        <div className="space-y-3">
          {accounts.map((account) => {
            const invested = getDcaTotal(account.id)
            const limit = account.annualLimit
            const ratio = limit ? Math.min((invested / limit) * 100, 100) : 0

            return (
              <div key={account.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{account.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">
                      {ACCOUNT_TYPE_LABEL[account.accountType]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {invested.toLocaleString()}원
                    {limit ? <span className="text-gray-400"> / {limit.toLocaleString()}원</span> : null}
                  </span>
                </div>
                {limit ? (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6',
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
