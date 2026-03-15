import { useEffect, useState } from 'react'
import { cashflowApi } from '../api'
import type { CashflowCategory, CashflowRecord } from '../types'
import CashflowForm from '../components/CashflowForm'

export default function CashflowPage() {
  const [records, setRecords] = useState<CashflowRecord[]>([])
  const [categories, setCategories] = useState<CashflowCategory[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1) // 0 = 전체

  const isYearView = selectedMonth === 0
  const startDate = isYearView
    ? `${selectedYear}-01-01`
    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  const endDate = isYearView
    ? `${selectedYear}-12-31`
    : new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

  // 연도별 전체 조회용
  const yearStart = `${selectedYear}-01-01`
  const yearEnd = `${selectedYear}-12-31`
  const [yearRecords, setYearRecords] = useState<CashflowRecord[]>([])

  useEffect(() => {
    cashflowApi.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (isYearView) {
      cashflowApi.getRecords(yearStart, yearEnd).then((data) => {
        setRecords(data)
        setYearRecords(data)
      }).catch(() => {})
    } else {
      cashflowApi.getRecords(startDate, endDate).then(setRecords).catch(() => {})
      cashflowApi.getRecords(yearStart, yearEnd).then(setYearRecords).catch(() => {})
    }
  }, [refreshKey, startDate, endDate, yearStart, yearEnd, isYearView])

  const totalIncome = records
    .filter((r) => r.flowType === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalExpense = records
    .filter((r) => r.flowType === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0)

  const investable = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((investable / totalIncome) * 100) : 0

  // 지출 카테고리별 합산 (대분류 + 소분류)
  const expenseByParent = records
    .filter((r) => r.flowType === 'EXPENSE' && r.parentName)
    .reduce<Record<string, number>>((acc, r) => {
      const key = r.parentName!
      acc[key] = (acc[key] || 0) + r.amount
      return acc
    }, {})

  const expenseByCategory = records
    .filter((r) => r.flowType === 'EXPENSE' && r.parentName)
    .reduce<Record<string, Record<string, number>>>((acc, r) => {
      const parent = r.parentName!
      if (!acc[parent]) acc[parent] = {}
      acc[parent][r.categoryName] = (acc[parent][r.categoryName] || 0) + r.amount
      return acc
    }, {})

  // 연간 월별 요약
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const monthRecords = yearRecords.filter((r) => {
      const rMonth = new Date(r.recordDate).getMonth() + 1
      return rMonth === m
    })
    const income = monthRecords.filter((r) => r.flowType === 'INCOME').reduce((s, r) => s + r.amount, 0)
    const expense = monthRecords.filter((r) => r.flowType === 'EXPENSE').reduce((s, r) => s + r.amount, 0)
    return { month: m, income, expense, count: monthRecords.length }
  })

  const yearTotalIncome = yearRecords.filter((r) => r.flowType === 'INCOME').reduce((s, r) => s + r.amount, 0)
  const yearTotalExpense = yearRecords.filter((r) => r.flowType === 'EXPENSE').reduce((s, r) => s + r.amount, 0)

  const handleDelete = async (id: number) => {
    await cashflowApi.delete(id)
    setRefreshKey((k) => k + 1)
  }

  const currentYear = now.getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">수입/지출</h2>

      {/* 연도/월 선택 */}
      <div className="flex items-center gap-3">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <div className="flex gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedMonth === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m}월
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedMonth(0)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              selectedMonth === 0
                ? 'bg-gray-800 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* 월간 요약 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">{isYearView ? '연간 수입' : '수입'}</p>
          <p className="text-lg font-bold text-blue-600">{totalIncome.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">{isYearView ? '연간 지출' : '지출'}</p>
          <p className="text-lg font-bold text-red-500">{totalExpense.toLocaleString()}원</p>
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

      {/* 지출 카테고리별 */}
      {totalExpense > 0 && (() => {
        const PARENT_ORDER = ['고정비', '생활비', '비상금']
        const allParents = PARENT_ORDER.map((name) => [name, expenseByParent[name] || 0] as [string, number])
        // 혹시 목록에 없는 대분류가 있으면 뒤에 추가
        Object.entries(expenseByParent).forEach(([name, amount]) => {
          if (!PARENT_ORDER.includes(name)) allParents.push([name, amount])
        })
        return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">
            지출 분류별 <span className="text-gray-400 text-sm font-normal">{totalExpense.toLocaleString()}원</span>
          </h3>
          <div className="space-y-4">
            {allParents.map(([parentName, parentAmount]) => {
                const parentRatio = totalExpense > 0 ? (parentAmount / totalExpense) * 100 : 0
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
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div
                        className="h-1.5 rounded-full bg-red-400"
                        style={{ width: `${parentRatio}%` }}
                      />
                    </div>
                    {sortedChildren.length > 1 && (
                      <div className="ml-3 space-y-1">
                        {sortedChildren.map(([catName, catAmount]) => {
                          const catRatio = parentAmount > 0 ? (catAmount / parentAmount) * 100 : 0
                          return (
                            <div key={catName} className="flex justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">└</span>
                                <span className="text-gray-500">{catName}</span>
                              </div>
                              <span className="text-gray-500">
                                {catAmount.toLocaleString()}원
                                <span className="text-gray-300 ml-1">({Math.round(catRatio)}%)</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
        )
      })()}

      {/* 다건 입력 폼 */}
      <CashflowForm
        categories={categories}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      {/* 이번 달 기록 목록 */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">
            {isYearView ? `${selectedYear}년 전체` : `${selectedMonth}월`} 기록 <span className="text-gray-400 text-sm font-normal">({records.length}건)</span>
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="py-2 text-left font-medium">날짜</th>
                  <th className="py-2 text-left font-medium">분류</th>
                  <th className="py-2 text-left font-medium">카테고리</th>
                  <th className="py-2 text-left font-medium">메모</th>
                  <th className="py-2 text-right font-medium">금액</th>
                  <th className="py-2 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 text-gray-500 whitespace-nowrap">{r.recordDate}</td>
                    <td className="py-1.5 text-gray-400">{r.parentName}</td>
                    <td className="py-1.5 text-gray-600">{r.categoryName}</td>
                    <td className="py-1.5 text-gray-400">{r.memo}</td>
                    <td className={`py-1.5 text-right font-medium whitespace-nowrap ${r.flowType === 'INCOME' ? 'text-blue-600' : 'text-red-500'}`}>
                      {r.flowType === 'INCOME' ? '+' : '-'}{r.amount.toLocaleString()}원
                    </td>
                    <td className="py-1.5 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-gray-300 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 연간 월별 요약 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">
          {selectedYear}년 월별 요약
          <span className="text-gray-400 text-sm font-normal ml-2">
            수입 {yearTotalIncome.toLocaleString()}원 / 지출 {yearTotalExpense.toLocaleString()}원
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="py-2 text-left font-medium">월</th>
                <th className="py-2 text-right font-medium">수입</th>
                <th className="py-2 text-right font-medium">지출</th>
                <th className="py-2 text-right font-medium">잔여</th>
                <th className="py-2 text-right font-medium">건수</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(({ month, income, expense, count }) => {
                const diff = income - expense
                const isCurrentMonth = selectedYear === currentYear && month === now.getMonth() + 1
                return (
                  <tr
                    key={month}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                      isCurrentMonth ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => setSelectedMonth(month)}
                  >
                    <td className="py-2 text-gray-600">{month}월</td>
                    <td className="py-2 text-right text-blue-600">
                      {income > 0 ? income.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 text-right text-red-500">
                      {expense > 0 ? expense.toLocaleString() : '-'}
                    </td>
                    <td className={`py-2 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {income > 0 || expense > 0 ? diff.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 text-right text-gray-400">{count > 0 ? count : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
