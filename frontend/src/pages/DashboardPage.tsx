import { useEffect, useState } from 'react'
import { accountApi, assetClassApi, dcaApi, holdingApi } from '../api'
import type { Account, Allocation, DcaRecord, Holding } from '../types'

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
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set())
  const year = new Date().getFullYear()

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    assetClassApi.getAllocations(USER_ID).then(setAllocations).catch(() => {})
    dcaApi.getByYear(year).then(setDcaRecords)
    holdingApi.getAll().then(setHoldings).catch(() => {})
  }, [year])

  const toggleAccount = (accountId: number) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev)
      next.has(accountId) ? next.delete(accountId) : next.add(accountId)
      return next
    })
  }

  const getHoldingsByAccount = (accountId: number) =>
    holdings.filter((h) => h.accountId === accountId)

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

            const accountHoldings = getHoldingsByAccount(account.id)
            const isExpanded = expandedAccounts.has(account.id)

            return (
              <div key={account.id}>
                <div
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1"
                  onClick={() => toggleAccount(account.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                    <span className="text-sm font-medium text-gray-700">{account.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">
                      {ACCOUNT_TYPE_LABEL[account.accountType]}
                    </span>
                    {accountHoldings.length > 0 && (
                      <span className="text-xs text-gray-400">{accountHoldings.length}종목</span>
                    )}
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
                {isExpanded && (
                  <div className="mt-2 ml-6 mb-2">
                    {accountHoldings.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-100">
                            <th className="text-left py-1 font-medium">티커</th>
                            <th className="text-left py-1 font-medium">종목명</th>
                            <th className="text-right py-1 font-medium">수량</th>
                            <th className="text-right py-1 font-medium">매수가</th>
                            <th className="text-right py-1 font-medium">매수금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountHoldings.map((h) => (
                            <tr key={h.id} className="border-b border-gray-50">
                              <td className="py-1 font-mono text-gray-600">{h.ticker}</td>
                              <td className="py-1 text-gray-500">{h.name}</td>
                              <td className="py-1 text-right text-gray-600">{h.quantity > 0 ? h.quantity.toLocaleString() : '-'}</td>
                              <td className="py-1 text-right text-gray-500">
                                {h.avgPrice > 0 ? `${h.currency === 'USD' ? '$' : '₩'}${h.avgPrice.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-1 text-right text-gray-700 font-medium">
                                {h.totalAmount > 0 ? `${h.currency === 'USD' ? '$' : '₩'}${Math.round(h.totalAmount).toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-gray-400">보유종목 없음</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
