import { useEffect, useState } from 'react'
import { accountApi, dcaApi, holdingApi } from '../api'
import type { Account, DcaRecord, Holding } from '../types'
import AccountForm from '../components/AccountForm'

const USER_ID = 1

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

function HoldingRow({ h, onUpdated }: { h: Holding; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(String(h.quantity))
  const [price, setPrice] = useState(String(h.avgPrice))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await holdingApi.update(h.id, { quantity: Number(qty), avgPrice: Number(price) })
      setEditing(false)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setQty(String(h.quantity))
    setPrice(String(h.avgPrice))
    setEditing(false)
  }

  const currSymbol = h.currency === 'USD' ? '$' : '₩'

  if (editing) {
    return (
      <tr className="border-b border-gray-50 bg-blue-50/30">
        <td className="py-1.5 font-mono text-gray-600 text-xs">{h.ticker}</td>
        <td className="py-1.5 text-gray-500 text-xs">{h.name}</td>
        <td className="py-1.5 text-right">
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
            className="border border-blue-300 rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none" />
        </td>
        <td className="py-1.5 text-right">
          <input type="number" value={price} step="0.01" onChange={(e) => setPrice(e.target.value)}
            className="border border-blue-300 rounded px-1.5 py-0.5 text-xs w-24 text-right focus:outline-none" />
        </td>
        <td className="py-1.5 text-right text-xs text-gray-400">
          {currSymbol}{Math.round(Number(qty) * Number(price)).toLocaleString()}
        </td>
        <td className="py-1.5 text-right">
          <div className="flex gap-1 justify-end">
            <button onClick={handleSave} disabled={saving}
              className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300">저장</button>
            <button onClick={handleCancel}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">취소</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setEditing(true)}>
      <td className="py-1.5 font-mono text-gray-600 text-xs">{h.ticker}</td>
      <td className="py-1.5 text-gray-500 text-xs">{h.name}</td>
      <td className="py-1.5 text-right text-xs text-gray-600">{h.quantity > 0 ? h.quantity.toLocaleString() : '-'}</td>
      <td className="py-1.5 text-right text-xs text-gray-500">
        {h.avgPrice > 0 ? `${currSymbol}${h.avgPrice.toLocaleString()}` : '-'}
      </td>
      <td className="py-1.5 text-right text-xs text-gray-700 font-medium">
        {h.totalAmount > 0 ? `${currSymbol}${Math.round(h.totalAmount).toLocaleString()}` : '-'}
      </td>
      <td className="py-1.5 text-right">
        <span className="text-xs text-gray-300">클릭하여 수정</span>
      </td>
    </tr>
  )
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [dcaRecords, setDcaRecords] = useState<DcaRecord[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const year = new Date().getFullYear()

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    dcaApi.getByYear(year).then(setDcaRecords)
    holdingApi.getAll().then(setHoldings).catch(() => {})
  }, [refreshKey, year])

  const getDcaTotal = (accountId: number) =>
    dcaRecords.filter((r) => r.accountId === accountId).reduce((sum, r) => sum + r.amount, 0)

  const getDcaCount = (accountId: number) =>
    dcaRecords.filter((r) => r.accountId === accountId).length

  const getHoldingsByAccount = (accountId: number) =>
    holdings.filter((h) => h.accountId === accountId)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">계좌 관리</h2>

      <div className="grid gap-4">
        {accounts.map((account) => {
          const invested = getDcaTotal(account.id)
          const count = getDcaCount(account.id)
          const limit = account.annualLimit
          const ratio = limit ? Math.min((invested / limit) * 100, 100) : 0
          const remaining = limit ? Math.max(limit - invested, 0) : null
          const accountHoldings = getHoldingsByAccount(account.id)
          const holdingTotal = accountHoldings.reduce((sum, h) => sum + h.totalAmount, 0)

          return (
            <div key={account.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{account.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {ACCOUNT_TYPE_LABEL[account.accountType]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    {invested.toLocaleString()}원
                  </p>
                  {limit && (
                    <p className="text-sm text-gray-400">
                      한도 {limit.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>

              {limit ? (
                <>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: ratio >= 100 ? '#10b981' : ratio >= 80 ? '#f59e0b' : '#3b82f6',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Math.round(ratio)}% 소진</span>
                    <span>잔여 {(remaining || 0).toLocaleString()}원</span>
                  </div>
                </>
              ) : null}

              <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
                <span>올해 {count}회 입금</span>
                {count > 0 && <span>평균 {Math.round(invested / count).toLocaleString()}원/회</span>}
                {accountHoldings.length > 0 && <span>{accountHoldings.length}종목 보유</span>}
                {holdingTotal > 0 && <span>매수총액 {Math.round(holdingTotal).toLocaleString()}{accountHoldings[0]?.currency === 'USD' ? '$' : '원'}</span>}
              </div>

              {/* 보유종목 목록 */}
              {accountHoldings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-xs border-b border-gray-100">
                        <th className="text-left py-1 font-medium">티커</th>
                        <th className="text-left py-1 font-medium">종목명</th>
                        <th className="text-right py-1 font-medium">수량</th>
                        <th className="text-right py-1 font-medium">매수가</th>
                        <th className="text-right py-1 font-medium">매수금액</th>
                        <th className="text-right py-1 font-medium w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountHoldings.map((h) => (
                        <HoldingRow key={h.id} h={h} onUpdated={() => setRefreshKey((k) => k + 1)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AccountForm userId={USER_ID} onCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
