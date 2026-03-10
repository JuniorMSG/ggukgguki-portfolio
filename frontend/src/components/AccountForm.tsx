import { useState } from 'react'
import { accountApi } from '../api'
import type { AccountType } from '../types'

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'PENSION_SAVINGS', label: '연금저축' },
  { value: 'IRP', label: 'IRP' },
  { value: 'ISA', label: 'ISA' },
  { value: 'OVERSEAS', label: '해외계좌' },
  { value: 'GENERAL', label: '일반' },
]

interface Props {
  userId: number
  onCreated: () => void
}

export default function AccountForm({ userId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('PENSION_SAVINGS')
  const [annualLimit, setAnnualLimit] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      await accountApi.create({
        userId,
        name,
        accountType,
        annualLimit: annualLimit ? Number(annualLimit) : undefined,
      })
      setName('')
      setAnnualLimit('')
      setOpen(false)
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
      >
        + 계좌 추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-700">새 계좌 추가</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">
          취소
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-500 mb-1">계좌명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 연금저축1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">유형</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm text-gray-500 mb-1">연간 한도 (원, 선택)</label>
          <input
            type="number"
            value={annualLimit}
            onChange={(e) => setAnnualLimit(e.target.value)}
            placeholder="예: 6000000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors text-sm"
      >
        {loading ? '추가 중...' : '추가'}
      </button>
    </form>
  )
}
