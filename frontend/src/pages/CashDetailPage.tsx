import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cashAssetApi } from '../api'
import type { CashAsset } from '../types'

const INTEREST_TAX_RATE = 0.154

export default function CashDetailPage() {
  const navigate = useNavigate()
  const [cashAssets, setCashAssets] = useState<CashAsset[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingCashId, setEditingCashId] = useState<number | null>(null)
  const [editCash, setEditCash] = useState({ balance: '', interestRate: '', memo: '' })
  const [showAddCash, setShowAddCash] = useState(false)
  const [newCash, setNewCash] = useState({ name: '', category: 'LIQUID' as string, balance: '', interestRate: '', memo: '' })

  useEffect(() => {
    cashAssetApi.getAll().then(setCashAssets).catch(() => {})
  }, [refreshKey])

  const cashTotal = cashAssets.reduce((s, c) => s + c.balance, 0)
  const fixedTotal = cashAssets.filter((c) => c.category === 'FIXED').reduce((s, c) => s + c.balance, 0)
  const liquidTotal = cashAssets.filter((c) => c.category === 'LIQUID').reduce((s, c) => s + c.balance, 0)
  const yearlyInterest = cashAssets.reduce((s, c) => s + Math.round(c.balance * c.interestRate / 100), 0)
  const yearlyInterestAfterTax = Math.round(yearlyInterest * (1 - INTEREST_TAX_RATE))

  const handleSaveCash = async (id: number) => {
    await cashAssetApi.update(id, { balance: Number(editCash.balance), interestRate: Number(editCash.interestRate), memo: editCash.memo || undefined })
    setEditingCashId(null)
    setRefreshKey((k) => k + 1)
  }

  const handleAddCash = async () => {
    if (!newCash.name || !newCash.balance) return
    await cashAssetApi.create({
      name: newCash.name, category: newCash.category, balance: Number(newCash.balance),
      interestRate: Number(newCash.interestRate || 0), memo: newCash.memo || undefined
    })
    setNewCash({ name: '', category: 'LIQUID', balance: '', interestRate: '', memo: '' })
    setShowAddCash(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/assets')}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">← 돌아가기</button>
        <h2 className="text-xl font-bold text-gray-800">현금성 자산</h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">현금 총액</p>
          <p className="text-lg font-bold text-gray-800">{cashTotal.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">비유동</p>
          <p className="text-lg font-bold text-gray-500">{fixedTotal.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">유동</p>
          <p className="text-lg font-bold text-blue-600">{liquidTotal.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-400">연간 이자 예상</p>
          <p className="text-lg font-bold text-green-600">{yearlyInterestAfterTax.toLocaleString()}원</p>
          <p className="text-xs text-gray-400">세전 {yearlyInterest.toLocaleString()}원</p>
        </div>
      </div>

      {['FIXED', 'LIQUID'].map((cat) => {
        const items = cashAssets.filter((c) => c.category === cat)
        return (
          <div key={cat} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700 mb-3">{cat === 'FIXED' ? '비유동 자산' : '유동 자산'}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-200">
                  <th className="py-2 text-left font-medium">자산명</th>
                  <th className="py-2 text-right font-medium">잔액</th>
                  <th className="py-2 text-right font-medium">이율</th>
                  <th className="py-2 text-right font-medium">세전이자(연)</th>
                  <th className="py-2 text-right font-medium">세후이자(연)</th>
                  <th className="py-2 text-left font-medium">메모</th>
                  <th className="py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const isEditing = editingCashId === c.id
                  const estInterest = Math.round(c.balance * c.interestRate / 100)
                  if (isEditing) {
                    const previewPre = Math.round(Number(editCash.balance) * Number(editCash.interestRate) / 100)
                    return (
                      <tr key={c.id} className="border-b border-gray-50 bg-blue-50/30">
                        <td className="py-2 text-gray-700 font-medium">{c.name}</td>
                        <td className="py-2 text-right">
                          <input type="number" value={editCash.balance} onChange={(e) => setEditCash({ ...editCash, balance: e.target.value })}
                            className="border border-blue-300 rounded px-2 py-0.5 text-xs w-28 text-right focus:outline-none" />
                        </td>
                        <td className="py-2 text-right">
                          <input type="number" value={editCash.interestRate} step="0.1" onChange={(e) => setEditCash({ ...editCash, interestRate: e.target.value })}
                            className="border border-blue-300 rounded px-2 py-0.5 text-xs w-16 text-right focus:outline-none" />
                        </td>
                        <td className="py-2 text-right text-gray-400 text-xs">{previewPre.toLocaleString()}원</td>
                        <td className="py-2 text-right text-gray-400 text-xs">{Math.round(previewPre * (1 - INTEREST_TAX_RATE)).toLocaleString()}원</td>
                        <td className="py-2">
                          <input type="text" value={editCash.memo} onChange={(e) => setEditCash({ ...editCash, memo: e.target.value })}
                            placeholder="메모" className="border border-blue-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none" />
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <button onClick={() => handleSaveCash(c.id)} className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded mr-1">저장</button>
                          <button onClick={async () => { await cashAssetApi.delete(c.id); setEditingCashId(null); setRefreshKey((k) => k + 1) }}
                            className="text-xs px-2 py-0.5 bg-red-100 text-red-500 rounded mr-1">삭제</button>
                          <button onClick={() => setEditingCashId(null)} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded">취소</button>
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingCashId(c.id); setEditCash({ balance: String(c.balance), interestRate: String(c.interestRate), memo: c.memo || '' }) }}>
                      <td className="py-2 text-gray-700 font-medium">{c.name}</td>
                      <td className="py-2 text-right text-gray-800">{c.balance.toLocaleString()}원</td>
                      <td className="py-2 text-right text-blue-600">{c.interestRate > 0 ? `${c.interestRate}%` : '-'}</td>
                      <td className="py-2 text-right text-gray-600">{estInterest > 0 ? `${estInterest.toLocaleString()}원` : '-'}</td>
                      <td className="py-2 text-right text-green-600">{estInterest > 0 ? `${Math.round(estInterest * (1 - INTEREST_TAX_RATE)).toLocaleString()}원` : '-'}</td>
                      <td className="py-2 text-gray-400">{c.memo || ''}</td>
                      <td className="py-2 text-right"><span className="text-xs text-gray-300">수정</span></td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="py-3 text-center text-gray-400 text-sm">항목 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      })}

      {showAddCash ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-200 space-y-3">
          <h3 className="font-medium text-gray-700">새 현금 자산</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={newCash.name} onChange={(e) => setNewCash({ ...newCash, name: e.target.value })}
              placeholder="자산명" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            <select value={newCash.category} onChange={(e) => setNewCash({ ...newCash, category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
              <option value="LIQUID">유동</option>
              <option value="FIXED">비유동</option>
            </select>
            <input type="number" value={newCash.balance} onChange={(e) => setNewCash({ ...newCash, balance: e.target.value })}
              placeholder="잔액" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            <input type="number" value={newCash.interestRate} step="0.1" onChange={(e) => setNewCash({ ...newCash, interestRate: e.target.value })}
              placeholder="이율 (%)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <input type="text" value={newCash.memo} onChange={(e) => setNewCash({ ...newCash, memo: e.target.value })}
            placeholder="메모 (선택)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          <div className="flex gap-2">
            <button onClick={handleAddCash} className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">추가</button>
            <button onClick={() => setShowAddCash(false)} className="flex-1 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg hover:bg-gray-200">취소</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddCash(true)}
          className="w-full py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors">
          + 현금 자산 추가
        </button>
      )}
    </div>
  )
}
