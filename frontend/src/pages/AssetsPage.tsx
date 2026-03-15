import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountApi, dcaApi, holdingApi, cashAssetApi } from '../api'
import type { Account, AccountType, CashAsset, DcaRecord, Holding } from '../types'

const INTEREST_TAX_RATE = 0.154

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allDca, setAllDca] = useState<DcaRecord[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [cashAssets, setCashAssets] = useState<CashAsset[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('GENERAL')
  const [newLimit, setNewLimit] = useState('')
  const currentYear = new Date().getFullYear()

  const handleAddAccount = async () => {
    if (!newName.trim()) return
    await accountApi.create({
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
    accountApi.getMyAccounts().then((accts) => {
      setAccounts(accts)
      Promise.all(accts.map((a) => holdingApi.getByAccount(a.id)))
        .then((results) => setHoldings(results.flat()))
        .catch(() => {})
    })
    cashAssetApi.getAll().then(setCashAssets).catch(() => {})
    const promises = Array.from({ length: currentYear - 2018 }, (_, i) => 2019 + i)
      .map((y) => dcaApi.getByYear(y))
    Promise.all(promises).then((results) => setAllDca(results.flat()))
  }, [refreshKey, currentYear])

  const cashTotal = cashAssets.reduce((s, c) => s + c.balance, 0)
  const fixedTotal = cashAssets.filter((c) => c.category === 'FIXED').reduce((s, c) => s + c.balance, 0)
  const liquidTotal = cashAssets.filter((c) => c.category === 'LIQUID').reduce((s, c) => s + c.balance, 0)
  const yearlyInterest = cashAssets.reduce((s, c) => s + Math.round(c.balance * c.interestRate / 100), 0)
  const yearlyInterestAfterTax = Math.round(yearlyInterest * (1 - INTEREST_TAX_RATE))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">자산 관리</h2>

      {/* 현금성 자산 (최상단) */}
      {cashAssets.length > 0 && (
        <div onClick={() => navigate('/assets/cash')}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 shadow-sm border border-green-100 cursor-pointer hover:shadow-md hover:border-green-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">현금성 자산</h3>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">{cashAssets.length}개</span>
            </div>
            <span className="text-xl font-bold text-green-700">{cashTotal.toLocaleString()}원</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-gray-500">비유동 <span className="text-gray-700 font-medium">{fixedTotal.toLocaleString()}</span></span>
            <span className="text-gray-500">유동 <span className="text-blue-600 font-medium">{liquidTotal.toLocaleString()}</span></span>
            <span className="text-gray-500">연 이자(세후) <span className="text-green-600 font-medium">{yearlyInterestAfterTax.toLocaleString()}</span></span>
          </div>
        </div>
      )}

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
              onClick={() => navigate(`/assets/${account.id}`)}
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
