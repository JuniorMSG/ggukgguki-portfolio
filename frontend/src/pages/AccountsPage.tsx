import { useEffect, useState } from 'react'
import { accountApi, dcaApi, holdingApi } from '../api'
import type { Account, AccountType, AnnualLimit, DcaRecord, Holding } from '../types'

const USER_ID = 1

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

// ─── 종목 수정 행 ───
function HoldingRow({ h, onUpdated }: { h: Holding; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(String(h.quantity))
  const [price, setPrice] = useState(String(h.avgPrice))
  const [saving, setSaving] = useState(false)
  const curr = h.currency === 'USD' ? '$' : '₩'

  const handleSave = async () => {
    setSaving(true)
    try {
      await holdingApi.update(h.id, { quantity: Number(qty), avgPrice: Number(price) })
      setEditing(false)
      onUpdated()
    } finally { setSaving(false) }
  }

  if (editing) {
    return (
      <tr className="border-b border-gray-50 bg-blue-50/30">
        <td className="py-2 font-mono text-gray-600 text-sm">{h.ticker}</td>
        <td className="py-2 text-gray-500 text-sm">{h.name}</td>
        <td className="py-2 text-right">
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
            className="border border-blue-300 rounded px-2 py-1 text-sm w-24 text-right focus:outline-none" />
        </td>
        <td className="py-2 text-right">
          <input type="number" value={price} step="0.01" onChange={(e) => setPrice(e.target.value)}
            className="border border-blue-300 rounded px-2 py-1 text-sm w-28 text-right focus:outline-none" />
        </td>
        <td className="py-2 text-right text-sm text-gray-400">
          {curr}{Math.round(Number(qty) * Number(price)).toLocaleString()}
        </td>
        <td className="py-2 text-right">
          <button onClick={handleSave} disabled={saving}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 mr-1">저장</button>
          <button onClick={() => { setQty(String(h.quantity)); setPrice(String(h.avgPrice)); setEditing(false) }}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">취소</button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setEditing(true)}>
      <td className="py-2 font-mono text-gray-600 text-sm">{h.ticker}</td>
      <td className="py-2 text-gray-500 text-sm">{h.name}</td>
      <td className="py-2 text-right text-sm text-gray-600">{h.quantity > 0 ? h.quantity.toLocaleString() : '-'}</td>
      <td className="py-2 text-right text-sm text-gray-500">{h.avgPrice > 0 ? `${curr}${h.avgPrice.toLocaleString()}` : '-'}</td>
      <td className="py-2 text-right text-sm text-gray-700 font-medium">{h.totalAmount > 0 ? `${curr}${Math.round(h.totalAmount).toLocaleString()}` : '-'}</td>
      <td className="py-2 text-right"><span className="text-xs text-gray-300">수정</span></td>
    </tr>
  )
}

// ─── 계좌 상세 ───
function AccountDetail({ account, holdings, dcaRecords, onBack, onUpdated }: {
  account: Account
  holdings: Holding[]
  dcaRecords: DcaRecord[]
  onBack: () => void
  onUpdated: () => void
}) {
  const thisYear = new Date().getFullYear()
  const [limits, setLimits] = useState<AnnualLimit[]>([])
  const [editingLimit, setEditingLimit] = useState<{ year: number; value: string } | null>(null)

  useEffect(() => {
    accountApi.getLimits(account.id).then(setLimits).catch(() => {})
  }, [account.id])

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

  // 연도별 입출금 합산
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
        <button onClick={onBack}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
          ← 돌아가기
        </button>
        <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
          {ACCOUNT_TYPE_LABEL[account.accountType]}
        </span>
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
        <h3 className="font-medium text-gray-700 mb-3">보유종목</h3>
        {holdings.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-200">
                <th className="text-left py-2 font-medium">티커</th>
                <th className="text-left py-2 font-medium">종목명</th>
                <th className="text-right py-2 font-medium">수량</th>
                <th className="text-right py-2 font-medium">매수가</th>
                <th className="text-right py-2 font-medium">매수금액</th>
                <th className="text-right py-2 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <HoldingRow key={h.id} h={h} onUpdated={onUpdated} />
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

// ─── 메인: 카드 목록 ───
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allDca, setAllDca] = useState<DcaRecord[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('GENERAL')
  const [newLimit, setNewLimit] = useState('')
  const currentYear = new Date().getFullYear()

  const handleAddAccount = async () => {
    if (!newName.trim()) return
    await accountApi.create({
      userId: USER_ID,
      name: newName.trim(),
      accountType: newType,
      annualLimit: newLimit ? Number(newLimit) : undefined,
    })
    setNewName('')
    setNewLimit('')
    setShowAddForm(false)
    setRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    holdingApi.getAll().then(setHoldings).catch(() => {})
    // 전체 DCA 조회 (2019~현재)
    const promises = Array.from({ length: currentYear - 2018 }, (_, i) => 2019 + i)
      .map((y) => dcaApi.getByYear(y))
    Promise.all(promises).then((results) => setAllDca(results.flat()))
  }, [refreshKey, currentYear])

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  if (selectedAccount) {
    return (
      <AccountDetail
        account={selectedAccount}
        holdings={holdings.filter((h) => h.accountId === selectedAccount.id)}
        dcaRecords={allDca.filter((r) => r.accountId === selectedAccount.id)}
        onBack={() => setSelectedAccountId(null)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">계좌 관리</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const accountHoldings = holdings.filter((h) => h.accountId === account.id)
          const accountDca = allDca.filter((r) => r.accountId === account.id)
          const totalInvested = accountDca.reduce((s, r) => s + r.amount, 0)
          const holdingTotal = accountHoldings.reduce((s, h) => s + h.totalAmount, 0)
          const curr = accountHoldings[0]?.currency === 'USD' ? '$' : '₩'
          const limit = account.annualLimit
          const yearDca = accountDca.filter((r) => new Date(r.recordDate).getFullYear() === currentYear)
          const yearInvested = yearDca.reduce((s, r) => s + r.amount, 0)
          const ratio = limit ? Math.min((yearInvested / limit) * 100, 100) : 0

          return (
            <div
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{account.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                  {ACCOUNT_TYPE_LABEL[account.accountType]}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">종목</span>
                  <span className="text-gray-700 font-medium">{accountHoldings.length}종목</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">매수총액</span>
                  <span className="text-gray-700 font-medium">
                    {holdingTotal > 0 ? `${curr}${Math.round(holdingTotal).toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">누적 투자</span>
                  <span className={`font-medium ${totalInvested < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                    {totalInvested.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 한도 바 */}
              {limit && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{currentYear}년</span>
                    <span>{Math.round(ratio)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${ratio}%`, backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6' }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* 계좌 추가 카드 */}
        {showAddForm ? (
          <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-blue-200 space-y-3">
            <h3 className="font-semibold text-gray-800">새 계좌</h3>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="계좌명" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <select value={newType} onChange={(e) => setNewType(e.target.value as AccountType)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="PENSION_SAVINGS">연금저축</option>
              <option value="IRP">IRP</option>
              <option value="ISA">ISA</option>
              <option value="OVERSEAS">해외계좌</option>
              <option value="GENERAL">일반</option>
            </select>
            <input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)}
              placeholder="연간 한도 (선택)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="flex gap-2">
              <button onClick={handleAddAccount}
                className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">추가</button>
              <button onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg hover:bg-gray-200">취소</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setShowAddForm(true)}
            className="bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-center min-h-[160px]">
            <div className="text-center">
              <span className="text-3xl text-gray-300">+</span>
              <p className="text-sm text-gray-400 mt-1">계좌 추가</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
