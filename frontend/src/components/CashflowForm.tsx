import { useState } from 'react'
import { cashflowApi } from '../api'
import type { CashflowCategory, FlowType } from '../types'

interface Props {
  categories: CashflowCategory[]
  onCreated: () => void
}

interface Row {
  id: number
  flowType: FlowType
  parentId: number
  categoryId: number
  amount: string
  recordDate: string
  memo: string
}

let rowIdSeq = 1
const makeRow = (defaults?: Partial<Row>): Row => ({
  id: rowIdSeq++,
  flowType: defaults?.flowType ?? 'EXPENSE',
  parentId: defaults?.parentId ?? 0,
  categoryId: 0,
  amount: '',
  recordDate: defaults?.recordDate ?? new Date().toISOString().split('T')[0],
  memo: '',
})

export default function CashflowForm({ categories, onCreated }: Props) {
  const [rows, setRows] = useState<Row[]>([makeRow()])
  const [loading, setLoading] = useState(false)

  const updateRow = (id: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: number) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const addRow = () => {
    const last = rows[rows.length - 1]
    setRows((prev) => [...prev, makeRow({ flowType: last?.flowType, parentId: last?.parentId, recordDate: last?.recordDate })])
  }

  const getParentCategories = (flowType: FlowType) =>
    categories
      .filter((c) => c.parentId === null && c.flowType === flowType)
      .sort((a, b) => a.displayOrder - b.displayOrder)

  const getChildCategories = (parentId: number) =>
    categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder)

  const validRows = rows.filter((r) => r.categoryId > 0 && r.amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validRows.length === 0) return

    setLoading(true)
    try {
      await Promise.all(
        validRows.map((r) =>
          cashflowApi.create({
            categoryId: r.categoryId,
            amount: Number(r.amount),
            recordDate: r.recordDate,
            memo: r.memo || undefined,
          })
        )
      )
      setRows([makeRow()])
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-700">기록 추가</h3>
        <span className="text-xs text-gray-400">{validRows.length}건 입력 가능</span>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => {
          return (
            <div key={row.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-300 w-5 text-right">{idx + 1}</span>

              {/* 수입/지출 선택 */}
              <div className="shrink-0 flex rounded overflow-hidden border border-gray-200">
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { flowType: 'EXPENSE', parentId: 0, categoryId: 0 })}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    row.flowType === 'EXPENSE'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { flowType: 'INCOME', parentId: 0, categoryId: 0 })}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    row.flowType === 'INCOME'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  수입
                </button>
              </div>

              {/* 대분류 */}
              <select
                value={row.parentId}
                onChange={(e) => updateRow(row.id, { parentId: Number(e.target.value), categoryId: 0 })}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-24"
              >
                <option value={0}>대분류</option>
                {getParentCategories(row.flowType).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* 소분류 */}
              <select
                value={row.categoryId}
                onChange={(e) => updateRow(row.id, { categoryId: Number(e.target.value) })}
                disabled={!row.parentId}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-28 disabled:bg-gray-50 disabled:text-gray-300"
              >
                <option value={0}>소분류</option>
                {row.parentId > 0 && getChildCategories(row.parentId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* 금액 */}
              <input
                type="number"
                value={row.amount}
                onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                placeholder="금액"
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-28"
              />

              {/* 날짜 */}
              <input
                type="date"
                value={row.recordDate}
                onChange={(e) => updateRow(row.id, { recordDate: e.target.value })}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-36"
              />

              {/* 메모 */}
              <input
                type="text"
                value={row.memo}
                onChange={(e) => updateRow(row.id, { memo: e.target.value })}
                placeholder="메모"
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-24"
              />

              {/* 행 삭제 */}
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-gray-300 hover:text-red-400 text-sm shrink-0"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          + 행 추가
        </button>
        <button
          type="submit"
          disabled={loading || validRows.length === 0}
          className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
        >
          {loading ? '저장 중...' : `${validRows.length}건 저장`}
        </button>
      </div>
    </form>
  )
}
