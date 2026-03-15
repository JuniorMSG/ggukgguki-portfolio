import { useEffect, useState } from 'react'
import { accountApi, assetClassApi, dcaApi, holdingApi, cashflowApi, snapshotApi } from '../api'
import type { Account, Allocation, DcaRecord, Holding, CashflowRecord, WeeklySnapshot } from '../types'

const USER_ID = 1

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6']
const TABS = ['총자산', '투자현황', '주간추이', '수입/지출'] as const
type Tab = typeof TABS[number]

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('총자산')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allDca, setAllDca] = useState<DcaRecord[]>([])
  const [cashRecords, setCashRecords] = useState<CashflowRecord[]>([])
  const [yearCashRecords, setYearCashRecords] = useState<CashflowRecord[]>([])
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([])

  const now = new Date()
  const currentYear = now.getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const year = selectedYear
  const month = selectedYear === currentYear ? now.getMonth() + 1 : 12
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]
  const yearOptions = Array.from({ length: currentYear - 2018 }, (_, i) => currentYear - i)

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    assetClassApi.getAllocations(USER_ID).then(setAllocations).catch(() => {})
    holdingApi.getAll().then(setHoldings).catch(() => {})
    cashflowApi.getRecords(USER_ID, monthStart, monthEnd).then(setCashRecords).catch(() => {})
    cashflowApi.getRecords(USER_ID, `${year}-01-01`, `${year}-12-31`).then(setYearCashRecords).catch(() => {})
    snapshotApi.getAll(USER_ID).then(setSnapshots).catch(() => {})
    // 전체 DCA
    const promises = Array.from({ length: year - 2018 }, (_, i) => 2019 + i).map((y) => dcaApi.getByYear(y))
    Promise.all(promises).then((r) => setAllDca(r.flat()))
  }, [year, monthStart, monthEnd])

  // ─── 공통 데이터 ───
  const totalHoldingKRW = holdings.filter((h) => h.currency === 'KRW').reduce((s, h) => s + h.totalAmount, 0)
  const totalHoldingUSD = holdings.filter((h) => h.currency === 'USD').reduce((s, h) => s + h.totalAmount, 0)
  const yearDca = allDca.filter((r) => new Date(r.recordDate).getFullYear() === year)
  const yearInvested = yearDca.reduce((s, r) => s + r.amount, 0)
  const totalInvested = allDca.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* 탭 + 연도 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
          {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {tab === '총자산' && (
        <TotalAssetTab
          accounts={accounts} holdings={holdings} allocations={allocations}
          totalInvested={totalInvested} totalHoldingKRW={totalHoldingKRW} totalHoldingUSD={totalHoldingUSD}
          allDca={allDca} year={year} snapshots={snapshots}
        />
      )}
      {tab === '투자현황' && (
        <InvestmentTab
          accounts={accounts} allDca={allDca} yearDca={yearDca}
          yearInvested={yearInvested} year={year}
        />
      )}
      {tab === '주간추이' && (
        <SnapshotTab snapshots={snapshots} year={year} />
      )}
      {tab === '수입/지출' && (
        <CashflowTab
          cashRecords={cashRecords} yearCashRecords={yearCashRecords}
          year={year} month={month}
        />
      )}
    </div>
  )
}

// ─── 총자산 탭 ───
function TotalAssetTab({ accounts, holdings, allocations, totalInvested, totalHoldingKRW, totalHoldingUSD, allDca, year, snapshots }: {
  accounts: Account[]; holdings: Holding[]; allocations: Allocation[]
  totalInvested: number; totalHoldingKRW: number; totalHoldingUSD: number
  allDca: DcaRecord[]; year: number; snapshots: WeeklySnapshot[]
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 최신 스냅샷
  const yearSnapshots = snapshots.filter((s) => new Date(s.startDate).getFullYear() === year).sort((a, b) => b.startDate.localeCompare(a.startDate))
  const latest = yearSnapshots[0]

  // 연도별 순증가액
  const snapshotYears = [...new Set(snapshots.map((s) => new Date(s.startDate).getFullYear()))].sort()
  const yearlyChange: { year: number; change: number }[] = snapshotYears.map((y) => {
    const ys = snapshots.filter((s) => new Date(s.startDate).getFullYear() === y).sort((a, b) => a.startDate.localeCompare(b.startDate))
    const change = ys.reduce((s, snap) => s + snap.weeklyChange, 0)
    return { year: y, change }
  })

  const fmtM = (n: number) => { if (Math.abs(n) >= 1e8) return `${(n/1e8).toFixed(1)}억`; if (Math.abs(n) >= 1e4) return `${Math.round(n/1e4).toLocaleString()}만`; return n.toLocaleString() }

  return (
    <>
      {/* 스냅샷 기반 자산 요약 */}
      {latest ? (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">자본 총액</p>
            <p className="text-xl font-bold text-gray-800">{fmtM(latest.totalCapital)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">투자 자산</p>
            <p className="text-xl font-bold text-blue-600">{fmtM(latest.totalInvestment)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">수익률</p>
            <p className="text-xl font-bold text-green-600">{latest.returnRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">배당 (누적)</p>
            <p className="text-xl font-bold text-gray-800">{fmtM(latest.totalDividend)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">계좌</p>
            <p className="text-2xl font-bold text-gray-800">{accounts.length}개</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">보유종목</p>
            <p className="text-2xl font-bold text-blue-600">{holdings.length}종목</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">매수총액 (KRW)</p>
            <p className="text-xl font-bold text-gray-800">₩{Math.round(totalHoldingKRW).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400">매수총액 (USD)</p>
            <p className="text-xl font-bold text-gray-800">${Math.round(totalHoldingUSD).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* 매수/투자 요약 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-xs text-gray-400">누적 투자금</p><p className="text-lg font-bold text-blue-600">{totalInvested.toLocaleString()}원</p></div>
          <div><p className="text-xs text-gray-400">매수총액 (KRW)</p><p className="text-lg font-bold text-gray-700">₩{Math.round(totalHoldingKRW).toLocaleString()}</p></div>
          <div><p className="text-xs text-gray-400">매수총액 (USD)</p><p className="text-lg font-bold text-gray-700">${Math.round(totalHoldingUSD).toLocaleString()}</p></div>
        </div>
      </div>

      {/* 연도별 순증가액 */}
      {yearlyChange.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">연도별 순증가액</h3>
          <div className="grid grid-cols-4 gap-3">
            {yearlyChange.map(({ year: y, change }) => (
              <div key={y} className={`rounded-lg p-3 text-center ${y === year ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-400">{y}년</p>
                <p className={`text-sm font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {change >= 0 ? '+' : ''}{fmtM(change)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자산 비중 */}
      {allocations.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">목표 자산 비중</h3>
          <div className="flex rounded-full h-5 overflow-hidden">
            {allocations.map((alloc, i) => {
              if (alloc.targetRatio === 0) return null
              const total = allocations.reduce((s, a) => s + a.targetRatio, 0)
              return (
                <div key={alloc.id} className="h-full"
                  style={{ width: `${(alloc.targetRatio / total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
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
        <h3 className="font-medium text-gray-700 mb-3">계좌별 현황</h3>
        <div className="space-y-3">
          {accounts.map((account) => {
            const acctHoldings = holdings.filter((h) => h.accountId === account.id)
            const acctDca = allDca.filter((r) => r.accountId === account.id)
            const acctTotal = acctDca.reduce((s, r) => s + r.amount, 0)
            const holdingTotal = acctHoldings.reduce((s, h) => s + h.totalAmount, 0)
            const curr = acctHoldings[0]?.currency === 'USD' ? '$' : '₩'
            const isExpanded = expandedId === account.id
            const yearAmt = acctDca.filter((r) => new Date(r.recordDate).getFullYear() === year).reduce((s, r) => s + r.amount, 0)
            const limit = account.annualLimit
            const ratio = limit ? Math.min((yearAmt / limit) * 100, 100) : 0

            return (
              <div key={account.id}>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1 py-1"
                  onClick={() => setExpandedId(isExpanded ? null : account.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                    <span className="text-sm font-medium text-gray-700">{account.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">
                      {ACCOUNT_TYPE_LABEL[account.accountType]}
                    </span>
                    {acctHoldings.length > 0 && <span className="text-xs text-gray-400">{acctHoldings.length}종목</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      {holdingTotal > 0 ? `${curr}${Math.round(holdingTotal).toLocaleString()}` : '-'}
                    </span>
                    {limit && (
                      <span className="text-xs text-gray-400 ml-2">{Math.round(ratio)}%</span>
                    )}
                  </div>
                </div>
                {limit && (
                  <div className="bg-gray-100 rounded-full h-1.5 ml-5 overflow-hidden" style={{ width: 'calc(100% - 1.25rem)' }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${ratio}%`, backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6' }} />
                  </div>
                )}
                {isExpanded && acctHoldings.length > 0 && (
                  <div className="mt-2 ml-6 mb-2">
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
                        {acctHoldings.map((h) => (
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── 투자현황 탭 ───
function InvestmentTab({ accounts, allDca, yearDca, yearInvested, year }: {
  accounts: Account[]; allDca: DcaRecord[]; yearDca: DcaRecord[]
  yearInvested: number; year: number
}) {
  const totalLimit = accounts.reduce((s, a) => s + (a.annualLimit || 0), 0)
  const limitRatio = totalLimit > 0 ? Math.round((yearInvested / totalLimit) * 100) : 0

  // 월별 투자금
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const monthRecords = yearDca.filter((r) => new Date(r.recordDate).getMonth() + 1 === m)
    return { month: m, amount: monthRecords.reduce((s, r) => s + r.amount, 0), count: monthRecords.length }
  })

  // 계좌별 올해 투자
  const yearByAccount = accounts.map((a) => {
    const records = yearDca.filter((r) => r.accountId === a.id)
    const amount = records.reduce((s, r) => s + r.amount, 0)
    return { account: a, amount, count: records.length }
  }).filter((x) => x.amount !== 0 || x.account.annualLimit)

  // 연도별 누적
  const years = [...new Set(allDca.map((r) => new Date(r.recordDate).getFullYear()))].sort()
  let cumulative = 0

  return (
    <>
      {/* 올해 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">{year}년 투자</p>
          <p className="text-2xl font-bold text-blue-600">{yearInvested.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">한도 소진</p>
          <p className="text-2xl font-bold text-gray-800">{limitRatio}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">투자 횟수</p>
          <p className="text-2xl font-bold text-gray-800">{yearDca.length}회</p>
        </div>
      </div>

      {/* 계좌별 올해 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">{year}년 계좌별 투자</h3>
        <div className="space-y-3">
          {yearByAccount.map(({ account, amount }) => {
            const limit = account.annualLimit
            const ratio = limit ? Math.min((amount / limit) * 100, 100) : 0
            return (
              <div key={account.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{account.name}</span>
                  <span className="text-gray-700 font-medium">
                    {amount.toLocaleString()}원
                    {limit && <span className="text-gray-400 ml-1">/ {limit.toLocaleString()}원</span>}
                  </span>
                </div>
                {limit && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${ratio}%`, backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 월별 투자 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">{year}년 월별 투자</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-200">
              <th className="py-2 text-left font-medium">월</th>
              <th className="py-2 text-right font-medium">투자금</th>
              <th className="py-2 text-right font-medium">횟수</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map(({ month, amount, count }) => (
              <tr key={month} className={`border-b border-gray-50 ${month === new Date().getMonth() + 1 ? 'bg-blue-50/50' : ''}`}>
                <td className="py-1.5 text-gray-600">{month}월</td>
                <td className={`py-1.5 text-right font-medium ${amount > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                  {amount > 0 ? amount.toLocaleString() : '-'}
                </td>
                <td className="py-1.5 text-right text-gray-400">{count > 0 ? count : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 연도별 누적 투자 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">연도별 누적 투자</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-200">
              <th className="py-2 text-left font-medium">연도</th>
              <th className="py-2 text-right font-medium">투자금</th>
              <th className="py-2 text-right font-medium">누적</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const amt = allDca.filter((r) => new Date(r.recordDate).getFullYear() === y).reduce((s, r) => s + r.amount, 0)
              cumulative += amt
              return (
                <tr key={y} className={`border-b border-gray-50 ${y === year ? 'bg-blue-50/50' : ''}`}>
                  <td className="py-1.5 text-gray-600">{y}년</td>
                  <td className={`py-1.5 text-right font-medium ${amt < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {amt.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right text-blue-600 font-medium">{cumulative.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ─── 수입/지출 탭 ───
function CashflowTab({ cashRecords, yearCashRecords, year, month }: {
  cashRecords: CashflowRecord[]; yearCashRecords: CashflowRecord[]
  year: number; month: number
}) {
  const monthIncome = cashRecords.filter((r) => r.flowType === 'INCOME').reduce((s, r) => s + r.amount, 0)
  const monthExpense = cashRecords.filter((r) => r.flowType === 'EXPENSE').reduce((s, r) => s + r.amount, 0)
  const investable = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((investable / monthIncome) * 100) : 0

  const yearIncome = yearCashRecords.filter((r) => r.flowType === 'INCOME').reduce((s, r) => s + r.amount, 0)
  const yearExpense = yearCashRecords.filter((r) => r.flowType === 'EXPENSE').reduce((s, r) => s + r.amount, 0)

  // 지출 분류별 (이번 달)
  const PARENT_ORDER = ['고정비', '생활비', '비상금']
  const expenseByParent = cashRecords
    .filter((r) => r.flowType === 'EXPENSE' && r.parentName)
    .reduce<Record<string, number>>((acc, r) => { acc[r.parentName!] = (acc[r.parentName!] || 0) + r.amount; return acc }, {})

  const expenseByCategory = cashRecords
    .filter((r) => r.flowType === 'EXPENSE' && r.parentName)
    .reduce<Record<string, Record<string, number>>>((acc, r) => {
      const p = r.parentName!; if (!acc[p]) acc[p] = {}
      acc[p][r.categoryName] = (acc[p][r.categoryName] || 0) + r.amount; return acc
    }, {})

  const allParents = PARENT_ORDER.map((name) => [name, expenseByParent[name] || 0] as [string, number])

  // 월별 요약
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const monthRecs = yearCashRecords.filter((r) => new Date(r.recordDate).getMonth() + 1 === m)
    const inc = monthRecs.filter((r) => r.flowType === 'INCOME').reduce((s, r) => s + r.amount, 0)
    const exp = monthRecs.filter((r) => r.flowType === 'EXPENSE').reduce((s, r) => s + r.amount, 0)
    return { month: m, income: inc, expense: exp }
  })

  return (
    <>
      {/* 이번 달 요약 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">{month}월 수입</p>
          <p className="text-lg font-bold text-blue-600">{monthIncome.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">{month}월 지출</p>
          <p className="text-lg font-bold text-red-500">{monthExpense.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">투자 가능</p>
          <p className="text-lg font-bold text-green-600">{investable.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">저축률</p>
          <p className="text-lg font-bold text-gray-800">{savingsRate}%</p>
        </div>
      </div>

      {/* 연간 요약 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-2">{year}년 연간</h3>
        <div className="flex gap-6 text-sm">
          <span className="text-blue-600">수입 {yearIncome.toLocaleString()}원</span>
          <span className="text-red-500">지출 {yearExpense.toLocaleString()}원</span>
          <span className="text-green-600 font-medium">잔여 {(yearIncome - yearExpense).toLocaleString()}원</span>
        </div>
      </div>

      {/* 이번 달 지출 분류 */}
      {monthExpense > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">
            {month}월 지출 분류 <span className="text-gray-400 text-sm font-normal">{monthExpense.toLocaleString()}원</span>
          </h3>
          <div className="space-y-3">
            {allParents.map(([parentName, parentAmount]) => {
              const parentRatio = monthExpense > 0 ? (parentAmount / monthExpense) * 100 : 0
              const children = expenseByCategory[parentName] || {}
              const sortedChildren = Object.entries(children).sort((a, b) => b[1] - a[1])
              return (
                <div key={parentName}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{parentName}</span>
                    <span className="text-gray-700 font-medium">
                      {parentAmount.toLocaleString()}원
                      <span className="text-gray-400 ml-1">({Math.round(parentRatio)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${parentRatio}%` }} />
                  </div>
                  {sortedChildren.length > 1 && (
                    <div className="ml-3 space-y-0.5">
                      {sortedChildren.map(([catName, catAmount]) => (
                        <div key={catName} className="flex justify-between text-xs">
                          <span className="text-gray-400">└ {catName}</span>
                          <span className="text-gray-500">{catAmount.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 월별 수입/지출 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">{year}년 월별</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-200">
              <th className="py-2 text-left font-medium">월</th>
              <th className="py-2 text-right font-medium">수입</th>
              <th className="py-2 text-right font-medium">지출</th>
              <th className="py-2 text-right font-medium">잔여</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map(({ month: m, income, expense }) => {
              const diff = income - expense
              return (
                <tr key={m} className={`border-b border-gray-50 ${m === month ? 'bg-blue-50/50' : ''}`}>
                  <td className="py-1.5 text-gray-600">{m}월</td>
                  <td className="py-1.5 text-right text-blue-600">{income > 0 ? income.toLocaleString() : '-'}</td>
                  <td className="py-1.5 text-right text-red-500">{expense > 0 ? expense.toLocaleString() : '-'}</td>
                  <td className={`py-1.5 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {income > 0 || expense > 0 ? diff.toLocaleString() : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ─── 주간추이 탭 ───
function SnapshotTab({ snapshots, year }: { snapshots: WeeklySnapshot[]; year: number }) {
  const filtered = snapshots.filter((s) => new Date(s.startDate).getFullYear() === year).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const latest = filtered[filtered.length - 1]
  const first = filtered[0]
  const fmtM = (n: number) => { if (Math.abs(n) >= 1e8) return `${(n/1e8).toFixed(1)}억`; if (Math.abs(n) >= 1e4) return `${Math.round(n/1e4).toLocaleString()}만`; return n.toLocaleString() }

  return (
    <>
      {/* 연도는 상단 공통 선택 사용 */}
      {latest && (<div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400">자본 총액</p><p className="text-lg font-bold text-gray-800">{fmtM(latest.totalCapital)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400">투자 자산</p><p className="text-lg font-bold text-blue-600">{fmtM(latest.totalInvestment)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400">수익률</p><p className="text-lg font-bold text-green-600">{latest.returnRate}%</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400">배당 (누적)</p><p className="text-lg font-bold text-gray-800">{fmtM(latest.totalDividend)}</p></div>
      </div>)}
      {filtered.length > 0 && (<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">{year}년 주간 추이 <span className="text-gray-400 text-sm font-normal">({filtered.length}주)</span></h3>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs"><thead className="sticky top-0 bg-white"><tr className="text-gray-400 border-b border-gray-200">
            <th className="py-2 text-left font-medium">주차</th><th className="py-2 text-right font-medium">자본총액</th><th className="py-2 text-right font-medium">투자자산</th>
            <th className="py-2 text-right font-medium">성장률</th><th className="py-2 text-right font-medium">수익률</th><th className="py-2 text-right font-medium">순증가</th>
            <th className="py-2 text-right font-medium">배당</th><th className="py-2 text-right font-medium">환율</th>
          </tr></thead><tbody>
            {filtered.map((s) => (<tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-1.5 text-gray-600 whitespace-nowrap">{s.weekLabel}</td>
              <td className="py-1.5 text-right text-gray-700">{fmtM(s.totalCapital)}</td>
              <td className="py-1.5 text-right text-blue-600">{fmtM(s.totalInvestment)}</td>
              <td className={`py-1.5 text-right ${s.capitalGrowthRate >= 100 ? 'text-green-600' : 'text-red-500'}`}>{s.capitalGrowthRate}%</td>
              <td className="py-1.5 text-right text-gray-700">{s.returnRate}%</td>
              <td className={`py-1.5 text-right font-medium ${s.weeklyChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>{s.weeklyChange !== 0 ? fmtM(s.weeklyChange) : '-'}</td>
              <td className="py-1.5 text-right text-gray-500">{s.weeklyDividend > 0 ? fmtM(s.weeklyDividend) : '-'}</td>
              <td className="py-1.5 text-right text-gray-400">{s.exchangeRate > 0 ? s.exchangeRate.toFixed(0) : '-'}</td>
            </tr>))}
          </tbody></table>
        </div>
      </div>)}
      {latest && first && (<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">{year}년 계좌별 변화</h3>
        <table className="w-full text-sm"><thead><tr className="text-gray-400 text-xs border-b border-gray-200">
          <th className="py-2 text-left font-medium">계좌</th><th className="py-2 text-right font-medium">시작</th><th className="py-2 text-right font-medium">현재</th><th className="py-2 text-right font-medium">변화</th>
        </tr></thead><tbody>
          {([['해외계좌',first.acctOverseas,latest.acctOverseas],['국내',first.acctDomestic,latest.acctDomestic],['IRP',first.acctIrp,latest.acctIrp],['연금저축1',first.acctPension1,latest.acctPension1],['연금저축2',first.acctPension2,latest.acctPension2],['ISA',first.acctIsa,latest.acctIsa],['현금',first.acctCash,latest.acctCash]] as [string,number,number][]).map(([name,start,end]) => {
            const diff = end - start
            return (<tr key={name} className="border-b border-gray-50">
              <td className="py-1.5 text-gray-600">{name}</td>
              <td className="py-1.5 text-right text-gray-500">{fmtM(start)}</td>
              <td className="py-1.5 text-right text-gray-700 font-medium">{fmtM(end)}</td>
              <td className={`py-1.5 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>{diff >= 0 ? '+' : ''}{fmtM(diff)}</td>
            </tr>)
          })}
        </tbody></table>
      </div>)}
    </>
  )
}
