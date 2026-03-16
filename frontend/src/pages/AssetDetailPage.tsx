import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { accountApi, dcaApi, holdingApi } from '../api'
import type { Account, AnnualLimit, DcaRecord, Holding } from '../types'
import HoldingRow from '../components/HoldingRow'
import MoneyInput from '../components/MoneyInput'

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accountId = Number(id)

  const [account, setAccount] = useState<Account | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [dcaRecords, setDcaRecords] = useState<DcaRecord[]>([])
  const [limits, setLimits] = useState<AnnualLimit[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingLimit, setEditingLimit] = useState<{ year: number; value: string } | null>(null)
  const [editingAccount, setEditingAccount] = useState(false)
  const [editName, setEditName] = useState('')
  const [showAddHolding, setShowAddHolding] = useState(false)
  const [newHolding, setNewHolding] = useState({ ticker: '', name: '', quantity: 0, totalAmount: 0, currency: 'KRW' })

  const thisYear = new Date().getFullYear()

  useEffect(() => {
    accountApi.getById(accountId).then(setAccount).catch(() => {})
    holdingApi.getByAccount(accountId).then(setHoldings).catch(() => {})
    dcaApi.getByAccount(accountId).then(setDcaRecords).catch(() => {})
    accountApi.getLimits(accountId).then(setLimits).catch(() => {})
  }, [accountId, refreshKey])

  if (!account) {
    return <div className="text-center text-gray-400 py-12">로딩 중...</div>
  }

  const getLimit = (y: number) => limits.find((l) => l.year === y)?.annualLimit ?? account.annualLimit ?? 0
  const yearDca = dcaRecords.filter((r) => new Date(r.recordDate).getFullYear() === thisYear)
  const invested = yearDca.reduce((sum, r) => sum + r.amount, 0)
  const limit = getLimit(thisYear)
  const ratio = limit ? Math.min((invested / limit) * 100, 100) : 0

  const handleSaveLimit = async (y: number, value: string) => {
    const amt = Number(value)
    if (isNaN(amt) || amt < 0) return
    await accountApi.setLimit(account.id, y, amt)
    const updated = await accountApi.getLimits(account.id)
    setLimits(updated)
    setEditingLimit(null)
  }

  const curr = holdings[0]?.currency === 'USD' ? '$' : '₩'
  const holdingTotal = holdings.reduce((s, h) => s + h.totalAmount, 0)

  const yearMap: Record<number, number> = {}
  dcaRecords.forEach((r) => {
    const y = new Date(r.recordDate).getFullYear()
    yearMap[y] = (yearMap[y] || 0) + r.amount
  })
  const years = Object.keys(yearMap).map(Number).sort()
  const totalInvested = dcaRecords.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/assets')}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
          ← 돌아가기
        </button>
        {editingAccount ? (
          <>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              className="text-xl font-bold text-gray-800 border border-blue-300 rounded-lg px-2 py-1 focus:outline-none" />
            <button onClick={async () => {
              await accountApi.update(accountId, { name: editName })
              setEditingAccount(false)
              setRefreshKey((k) => k + 1)
            }} className="text-xs px-2 py-1 bg-blue-500 text-white rounded">저장</button>
            <button onClick={() => setEditingAccount(false)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-400 rounded">취소</button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              {ACCOUNT_TYPE_LABEL[account.accountType]}
            </span>
            <button onClick={() => { setEditingAccount(true); setEditName(account.name) }}
              className="text-xs px-2 py-1 bg-gray-50 text-gray-400 rounded hover:bg-gray-100">수정</button>
            <button onClick={async () => {
              if (!confirm('이 계좌를 삭제할까요?')) return
              await accountApi.delete(accountId)
              navigate('/assets')
            }}
              className="text-xs px-2 py-1 bg-red-50 text-red-400 rounded hover:bg-red-100">삭제</button>
          </>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">총 투자금</p>
          <p className="text-lg font-bold text-gray-800">{totalInvested.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">보유종목</p>
          <p className="text-lg font-bold text-blue-600">{holdings.length}종목</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">매수총액</p>
          <p className="text-lg font-bold text-gray-800">{curr}{Math.round(holdingTotal).toLocaleString()}</p>
        </div>
      </div>

      {/* 한도 진행률 + 연도별 한도 관리 */}
      {(limit > 0 || limits.length > 0) && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          {limit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{thisYear}년 한도 소진</span>
                <span className="text-gray-700 font-medium">{invested.toLocaleString()}원 / {limit.toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all"
                  style={{ width: `${ratio}%`, backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6' }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{Math.round(ratio)}%</span>
                <span>잔여 {Math.max(limit - invested, 0).toLocaleString()}원</span>
              </div>
            </div>
          )}

          {/* 연도별 한도 테이블 */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">연도별 한도</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="py-1.5 text-left font-medium">연도</th>
                  <th className="py-1.5 text-right font-medium">한도</th>
                  <th className="py-1.5 text-right font-medium">투자금</th>
                  <th className="py-1.5 text-right font-medium">소진율</th>
                  <th className="py-1.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, i) => thisYear - 4 + i).map((y) => {
                  const yLimit = getLimit(y)
                  const yInvested = dcaRecords.filter((r) => new Date(r.recordDate).getFullYear() === y).reduce((s, r) => s + r.amount, 0)
                  const yRatio = yLimit > 0 ? Math.round((yInvested / yLimit) * 100) : 0
                  const isEditing = editingLimit?.year === y

                  return (
                    <tr key={y} className={`border-b border-gray-50 ${y === thisYear ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-1.5 text-gray-600">{y}년</td>
                      <td className="py-1.5 text-right">
                        {isEditing ? (
                          <input type="number" value={editingLimit.value}
                            onChange={(e) => setEditingLimit({ year: y, value: e.target.value })}
                            className="border border-blue-300 rounded px-2 py-0.5 text-xs w-28 text-right focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit(y, editingLimit.value)} />
                        ) : (
                          <span className="text-gray-700">{yLimit > 0 ? yLimit.toLocaleString() : '-'}</span>
                        )}
                      </td>
                      <td className="py-1.5 text-right text-gray-500">{yInvested > 0 ? yInvested.toLocaleString() : '-'}</td>
                      <td className={`py-1.5 text-right ${yRatio >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                        {yLimit > 0 ? `${Math.min(yRatio, 100)}%` : '-'}
                      </td>
                      <td className="py-1.5 text-right">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleSaveLimit(y, editingLimit.value)}
                              className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded">저장</button>
                            <button onClick={() => setEditingLimit(null)}
                              className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">취소</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingLimit({ year: y, value: String(yLimit) })}
                            className="text-xs text-gray-300 hover:text-blue-500">수정</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 보유종목 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-700">보유종목</h3>
          <button onClick={() => setShowAddHolding(!showAddHolding)}
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            {showAddHolding ? '취소' : '+ 종목 추가'}
          </button>
        </div>

        {showAddHolding && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
            {(() => {
              const qty = newHolding.quantity
              const total = newHolding.totalAmount
              const avgPrice = qty > 0 ? Math.round((total / qty) * 100) / 100 : 0
              const currSymbol = newHolding.currency === 'USD' ? '$' : '₩'
              return (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    <input type="text" value={newHolding.ticker} onChange={(e) => setNewHolding({ ...newHolding, ticker: e.target.value })}
                      placeholder="티커" className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
                    <input type="text" value={newHolding.name} onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                      placeholder="종목명" className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
                    <MoneyInput value={qty} onChange={(v) => setNewHolding({ ...newHolding, quantity: v })}
                      placeholder="수량" className="!rounded !px-2 !py-1.5 !text-sm" />
                    <MoneyInput value={total} onChange={(v) => setNewHolding({ ...newHolding, totalAmount: v })}
                      placeholder="매수금액" className="!rounded !px-2 !py-1.5 !text-sm" />
                    <select value={newHolding.currency} onChange={(e) => setNewHolding({ ...newHolding, currency: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300">
                      <option value="KRW">KRW</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  {qty > 0 && total > 0 && (
                    <p className="text-xs text-gray-400">매수가: {currSymbol}{avgPrice.toLocaleString()}</p>
                  )}
                  <button onClick={async () => {
                    if (!newHolding.ticker || !newHolding.name) return
                    await holdingApi.create({
                      accountId, assetClassId: 11, ticker: newHolding.ticker, name: newHolding.name,
                      currency: newHolding.currency, quantity: qty, avgPrice
                    })
                    setNewHolding({ ticker: '', name: '', quantity: 0, totalAmount: 0, currency: 'KRW' })
                    setShowAddHolding(false)
                    setRefreshKey((k) => k + 1)
                  }} className="text-xs px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600">추가</button>
                </>
              )
            })()}
          </div>
        )}

        {holdings.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-200">
                <th className="text-left py-2 font-medium">티커</th>
                <th className="text-left py-2 font-medium">종목명 ✏️</th>
                <th className="text-right py-2 font-medium">수량 ✏️</th>
                <th className="text-right py-2 font-medium">매수가</th>
                <th className="text-right py-2 font-medium">매수금액 ✏️</th>
                <th className="text-left py-2 font-medium">메모 ✏️</th>
                <th className="py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <HoldingRow key={h.id} h={h} onUpdated={() => setRefreshKey((k) => k + 1)} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">보유종목 없음</p>
        )}
      </div>

      {/* 연도별 입출금 */}
      {years.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">연도별 입출금</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-200">
                <th className="text-left py-2 font-medium">연도</th>
                <th className="text-right py-2 font-medium">입금액</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-600">{y}년</td>
                  <td className={`py-1.5 text-right font-medium ${yearMap[y] < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {yearMap[y].toLocaleString()}원
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-1.5 text-gray-800 font-medium">합계</td>
                <td className="py-1.5 text-right font-bold text-blue-600">{totalInvested.toLocaleString()}원</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 입출금 기록 */}
      {dcaRecords.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">
            입출금 기록 <span className="text-gray-400 text-sm font-normal">({dcaRecords.length}건)</span>
          </h3>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="text-left py-2 font-medium">날짜</th>
                  <th className="text-left py-2 font-medium">메모</th>
                  <th className="text-right py-2 font-medium">금액</th>
                </tr>
              </thead>
              <tbody>
                {[...dcaRecords].sort((a, b) => b.recordDate.localeCompare(a.recordDate)).map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-500">{r.recordDate}</td>
                    <td className="py-1.5 text-gray-400">{r.memo}</td>
                    <td className={`py-1.5 text-right font-medium ${r.amount < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                      {r.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
