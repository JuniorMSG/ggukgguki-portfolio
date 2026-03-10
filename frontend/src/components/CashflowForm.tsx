import { useState } from 'react'
import { cashflowApi } from '../api'
import type { CashflowCategory, FlowType } from '../types'

interface Props {
  userId: number
  categories: CashflowCategory[]
  onCreated: () => void
}

export default function CashflowForm({ userId, categories, onCreated }: Props) {
  const [flowType, setFlowType] = useState<FlowType>('EXPENSE')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [amount, setAmount] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  // 소분류만 (parent가 있는 것)
  const subCategories = categories.filter((c) => c.parentId !== null && c.flowType === flowType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !amount) return

    setLoading(true)
    try {
      await cashflowApi.create({
        userId,
        categoryId,
        amount: Number(amount),
        recordDate,
        memo: memo || undefined,
      })
      setAmount('')
      setMemo('')
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <h3 className="font-medium text-gray-700">기록 추가</h3>

      {/* 수입/지출 탭 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setFlowType('INCOME'); setCategoryId(0) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            flowType === 'INCOME'
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-gray-50 text-gray-400 border border-gray-100'
          }`}
        >
          수입
        </button>
        <button
          type="button"
          onClick={() => { setFlowType('EXPENSE'); setCategoryId(0) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            flowType === 'EXPENSE'
              ? 'bg-red-50 text-red-500 border border-red-200'
              : 'bg-gray-50 text-gray-400 border border-gray-100'
          }`}
        >
          지출
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-500 mb-1">카테고리</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value={0}>선택</option>
            {subCategories.map((c) => {
              const parent = categories.find((p) => p.id === c.parentId)
              return (
                <option key={c.id} value={c.id}>
                  {parent ? `${parent.name} > ` : ''}{c.name}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">금액 (원)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">날짜</label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="선택사항"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !categoryId || !amount}
        className={`w-full font-medium py-2 rounded-lg transition-colors text-sm text-white disabled:bg-gray-300 ${
          flowType === 'INCOME' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-400 hover:bg-red-500'
        }`}
      >
        {loading ? '기록 중...' : flowType === 'INCOME' ? '수입 기록' : '지출 기록'}
      </button>
    </form>
  )
}
