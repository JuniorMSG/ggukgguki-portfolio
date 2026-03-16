import { useEffect, useState } from 'react'
import { accountApi, dcaApi } from '../api'
import type { Account } from '../types'
import MoneyInput from './MoneyInput'

interface Props {
  onCreated: () => void
}

export default function DcaForm({ onCreated }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState<number>(0)
  const [amount, setAmount] = useState<number>(1000000)
  const [recordDate, setRecordDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [memo, setMemo] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    accountApi.getMyAccounts().then((list) => {
      setAccounts(list)
      if (list.length > 0 && accountId === 0) setAccountId(list[0].id)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId || !amount) return

    setLoading(true)
    try {
      await dcaApi.create({
        accountId,
        amount,
        recordDate,
        memo: memo || undefined,
      })
      setMemo('')
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <h2 className="text-xl font-bold text-gray-800">꾹꾹이 기록</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-500 mb-1">계좌</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">금액 (원)</label>
          <MoneyInput value={amount} onChange={setAmount} className="w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">투자일</label>
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
        disabled={loading || !accountId}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors text-sm"
      >
        {loading ? '기록 중...' : '꾹꾹이 기록하기'}
      </button>
    </form>
  )
}
