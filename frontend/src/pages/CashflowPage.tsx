import { useEffect, useState } from 'react'
import { cashflowApi } from '../api'
import type { CashflowCategory, CashflowRecord } from '../types'
import CashflowForm from '../components/CashflowForm'

const USER_ID = 1

export default function CashflowPage() {
  const [records, setRecords] = useState<CashflowRecord[]>([])
  const [categories, setCategories] = useState<CashflowCategory[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  useEffect(() => {
    cashflowApi.getCategories().then(setCategories)
    cashflowApi.getRecords(USER_ID, startDate, endDate).then(setRecords).catch(() => {})
  }, [refreshKey, startDate, endDate])

  const totalIncome = records
    .filter((r) => r.flowType === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalExpense = records
    .filter((r) => r.flowType === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0)

  const investable = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((investable / totalIncome) * 100) : 0

  // 지출 카테고리별 합산 (대분류 기준)
  const expenseByParent = records
    .filter((r) => r.flowType === 'EXPENSE' && r.parentName)
    .reduce<Record<string, number>>((acc, r) => {
      const key = r.parentName!
      acc[key] = (acc[key] || 0) + r.amount
      return acc
    }, {})

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">수입/지출</h2>

      {/* 월간 요약 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">수입</p>
          <p className="text-lg font-bold text-blue-600">{(totalIncome / 10000).toLocaleString()}만</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">지출</p>
          <p className="text-lg font-bold text-red-500">{(totalExpense / 10000).toLocaleString()}만</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">투자 가능</p>
          <p className="text-lg font-bold text-green-600">{(investable / 10000).toLocaleString()}만</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">저축률</p>
          <p className="text-lg font-bold text-gray-800">{savingsRate}%</p>
        </div>
      </div>

      {/* 지출 카테고리별 */}
      {Object.keys(expenseByParent).length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">지출 분류별</h3>
          <div className="space-y-2">
            {Object.entries(expenseByParent)
              .sort((a, b) => b[1] - a[1])
              .map(([name, amount]) => {
                const ratio = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{name}</span>
                      <span className="text-gray-700 font-medium">
                        {(amount / 10000).toLocaleString()}만원
                        <span className="text-gray-400 ml-1">({Math.round(ratio)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-red-400"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* 기록 입력 */}
      <CashflowForm
        userId={USER_ID}
        categories={categories}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      {/* 기록 목록 */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">이번 달 기록</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="text-sm">
                  <span className="text-gray-500">{r.recordDate}</span>
                  <span className="ml-2 text-gray-400">{r.parentName} &gt;</span>
                  <span className="ml-1 text-gray-600">{r.categoryName}</span>
                  {r.memo && <span className="ml-2 text-gray-400">{r.memo}</span>}
                </div>
                <span className={`text-sm font-medium ${r.flowType === 'INCOME' ? 'text-blue-600' : 'text-red-500'}`}>
                  {r.flowType === 'INCOME' ? '+' : '-'}{(r.amount / 10000).toLocaleString()}만
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
