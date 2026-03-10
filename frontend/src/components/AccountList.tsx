import { useEffect, useState } from 'react'
import { accountApi, dcaApi } from '../api'
import type { Account, DcaRecord } from '../types'

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

interface Props {
  userId: number
  refreshKey: number
}

export default function AccountList({ userId, refreshKey }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [dcaRecords, setDcaRecords] = useState<DcaRecord[]>([])
  const year = new Date().getFullYear()

  useEffect(() => {
    accountApi.getByUserId(userId).then(setAccounts)
    dcaApi.getByYear(year).then(setDcaRecords)
  }, [userId, refreshKey, year])

  const getDcaTotal = (accountId: number) =>
    dcaRecords
      .filter((r) => r.accountId === accountId)
      .reduce((sum, r) => sum + r.amount, 0)

  const totalInvested = dcaRecords.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">계좌 현황</h2>
        <div className="text-sm text-gray-500">
          {year}년 총 투자: <span className="font-semibold text-blue-600">{(totalInvested / 10000).toLocaleString()}만원</span>
        </div>
      </div>

      {accounts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">등록된 계좌가 없어요</p>
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => {
            const invested = getDcaTotal(account.id)
            const limit = account.annualLimit
            const ratio = limit ? Math.min((invested / limit) * 100, 100) : 0

            return (
              <div key={account.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-800">{account.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {ACCOUNT_TYPE_LABEL[account.accountType] || account.accountType}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-semibold text-gray-700">
                      {(invested / 10000).toLocaleString()}만원
                    </span>
                    {limit ? (
                      <span className="text-gray-400"> / {(limit / 10000).toLocaleString()}만원</span>
                    ) : null}
                  </div>
                </div>

                {limit ? (
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: ratio >= 100 ? '#10b981' : '#3b82f6',
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
