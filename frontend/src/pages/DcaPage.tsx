import { useEffect, useState } from 'react'
import { accountApi, dcaApi } from '../api'
import MoneyInput from '../components/MoneyInput'
import type { Account, DcaRecord } from '../types'
import DcaForm from '../components/DcaForm'

const ACCOUNT_ORDER = ['연금저축1', '연금저축2', 'IRP', 'ISA', '해외계좌', '일반-국내']

export default function DcaPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allRecords, setAllRecords] = useState<DcaRecord[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(0) // 0 = 전체
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ accountId: 0, amount: 0, memo: '' })

  const now = new Date()
  const currentYear = now.getFullYear()

  useEffect(() => {
    accountApi.getMyAccounts().then(setAccounts)
  }, [])

  useEffect(() => {
    // 2019~현재까지 전체 조회
    const promises = Array.from({ length: currentYear - 2018 }, (_, i) => 2019 + i)
      .map((y) => dcaApi.getByYear(y))
    Promise.all(promises).then((results) => {
      setAllRecords(results.flat())
    })
  }, [refreshKey, currentYear])

  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name || `계좌${id}`

  // 연도 목록
  const years = [...new Set(allRecords.map((r) => new Date(r.recordDate).getFullYear()))].sort((a, b) => b - a)

  // 연도별 계좌별 합산
  const yearSummary = years.map((year) => {
    const yearRecords = allRecords.filter((r) => new Date(r.recordDate).getFullYear() === year)
    const byAccount: Record<number, number> = {}
    yearRecords.forEach((r) => {
      byAccount[r.accountId] = (byAccount[r.accountId] || 0) + r.amount
    })
    const total = yearRecords.reduce((s, r) => s + r.amount, 0)
    return { year, byAccount, total, count: yearRecords.length }
  })

  // 전체 합계
  const grandTotal = allRecords.reduce((s, r) => s + r.amount, 0)
  const grandByAccount: Record<number, number> = {}
  allRecords.forEach((r) => {
    grandByAccount[r.accountId] = (grandByAccount[r.accountId] || 0) + r.amount
  })

  // 선택 연도 기록
  const filteredRecords = selectedYear === 0
    ? allRecords
    : allRecords.filter((r) => new Date(r.recordDate).getFullYear() === selectedYear)
  const sortedRecords = [...filteredRecords].sort((a, b) => b.recordDate.localeCompare(a.recordDate))

  // 정렬된 계좌 목록
  const sortedAccounts = [...accounts].sort((a, b) => {
    const ai = ACCOUNT_ORDER.indexOf(a.name)
    const bi = ACCOUNT_ORDER.indexOf(b.name)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">적립식 투자</h2>

      {/* 연도별 계좌 요약 */}
      {yearSummary.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">연도별 투자 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="py-2 text-left font-medium">연도</th>
                  {sortedAccounts.map((a) => (
                    <th key={a.id} className="py-2 text-right font-medium">{a.name}</th>
                  ))}
                  <th className="py-2 text-right font-medium">합계</th>
                </tr>
              </thead>
              <tbody>
                {yearSummary.map(({ year, byAccount, total }) => (
                  <tr
                    key={year}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${selectedYear === year ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedYear(selectedYear === year ? 0 : year)}
                  >
                    <td className="py-2 text-gray-600 font-medium">{year}년</td>
                    {sortedAccounts.map((a) => {
                      const v = byAccount[a.id] || 0
                      return (
                        <td key={a.id} className={`py-2 text-right ${v < 0 ? 'text-red-500' : v > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                          {v !== 0 ? v.toLocaleString() : '-'}
                        </td>
                      )
                    })}
                    <td className="py-2 text-right font-bold text-blue-600">{total.toLocaleString()}</td>
                  </tr>
                ))}
                {/* 합계 행 */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-medium">
                  <td className="py-2 text-gray-800">합계</td>
                  {sortedAccounts.map((a) => {
                    const v = grandByAccount[a.id] || 0
                    return (
                      <td key={a.id} className={`py-2 text-right ${v < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                        {v !== 0 ? v.toLocaleString() : '-'}
                      </td>
                    )
                  })}
                  <td className="py-2 text-right font-bold text-blue-700">{grandTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 입금 폼 */}
      <DcaForm onCreated={() => setRefreshKey((k) => k + 1)} />

      {/* 상세 기록 */}
      {sortedRecords.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">
            {selectedYear === 0 ? '전체' : `${selectedYear}년`} 기록
            <span className="text-gray-400 text-sm font-normal ml-1">({sortedRecords.length}건)</span>
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="py-2 text-left font-medium">날짜</th>
                  <th className="py-2 text-left font-medium">계좌</th>
                  <th className="py-2 text-left font-medium">메모</th>
                  <th className="py-2 text-right font-medium">금액</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((r) => {
                  const isEditing = editingId === r.id
                  if (isEditing) {
                    return (
                      <tr key={r.id} className="border-b border-gray-50 bg-blue-50/30">
                        <td className="py-1.5 text-gray-500">{r.recordDate}</td>
                        <td className="py-1.5">
                          <select value={editData.accountId} onChange={(e) => setEditData({ ...editData, accountId: Number(e.target.value) })}
                            className="border border-blue-300 rounded px-1.5 py-0.5 text-xs focus:outline-none">
                            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </td>
                        <td className="py-1.5">
                          <input type="text" value={editData.memo} onChange={(e) => setEditData({ ...editData, memo: e.target.value })}
                            className="border border-blue-300 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none" />
                        </td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                          <MoneyInput value={editData.amount} onChange={(v) => setEditData({ ...editData, amount: v })}
                            className="!border-blue-300 !rounded !px-1.5 !py-0.5 !text-xs w-28 text-right mr-2" />
                          <button onClick={async () => {
                            await dcaApi.update(r.id, { accountId: editData.accountId, amount: editData.amount, memo: editData.memo })
                            setEditingId(null); setRefreshKey((k) => k + 1)
                          }} className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded mr-1">저장</button>
                          <button onClick={async () => { await dcaApi.delete(r.id); setEditingId(null); setRefreshKey((k) => k + 1) }}
                            className="text-xs px-2 py-0.5 bg-red-100 text-red-500 rounded mr-1">삭제</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded">취소</button>
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingId(r.id); setEditData({ accountId: r.accountId, amount: r.amount, memo: r.memo || '' }) }}>
                      <td className="py-1.5 text-gray-500">{r.recordDate}</td>
                      <td className="py-1.5 text-gray-600">{accountName(r.accountId)}</td>
                      <td className="py-1.5 text-gray-400">{r.memo}</td>
                      <td className={`py-1.5 text-right font-medium ${r.amount < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {r.amount.toLocaleString()}원
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
