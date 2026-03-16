import { useState } from 'react'
import { holdingApi } from '../api'
import type { Holding } from '../types'

export default function HoldingRow({ h, onUpdated }: { h: Holding; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(h.quantity)
  const [totalAmount, setTotalAmount] = useState(Math.round(h.quantity * h.avgPrice))
  const [saving, setSaving] = useState(false)
  const curr = h.currency === 'USD' ? '$' : '₩'

  const avgPrice = qty > 0 ? Math.round((totalAmount / qty) * 100) / 100 : 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await holdingApi.update(h.id, { quantity: qty, avgPrice })
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
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))}
            className="border border-blue-300 rounded px-2 py-1 text-sm w-20 text-right focus:outline-none" />
        </td>
        <td className="py-2 text-right text-sm text-gray-400">
          {qty > 0 && totalAmount > 0 ? `${curr}${avgPrice.toLocaleString()}` : '-'}
        </td>
        <td className="py-2 text-right">
          <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="border border-blue-300 rounded px-2 py-1 text-sm w-28 text-right focus:outline-none" />
        </td>
        <td className="py-2 text-right whitespace-nowrap">
          <button onClick={handleSave} disabled={saving}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 mr-1">저장</button>
          <button onClick={() => { setQty(h.quantity); setTotalAmount(Math.round(h.quantity * h.avgPrice)); setEditing(false) }}
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
