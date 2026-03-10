import { useEffect, useState } from 'react'
import { accountApi, dcaApi } from '../api'
import type { Account, DcaRecord } from '../types'
import AccountForm from '../components/AccountForm'

const USER_ID = 1

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  PENSION_SAVINGS: '연금저축',
  IRP: 'IRP',
  ISA: 'ISA',
  OVERSEAS: '해외계좌',
  GENERAL: '일반',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [dcaRecords, setDcaRecords] = useState<DcaRecord[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const year = new Date().getFullYear()

  useEffect(() => {
    accountApi.getByUserId(USER_ID).then(setAccounts)
    dcaApi.getByYear(year).then(setDcaRecords)
  }, [refreshKey, year])

  const getDcaTotal = (accountId: number) =>
    dcaRecords.filter((r) => r.accountId === accountId).reduce((sum, r) => sum + r.amount, 0)

  const getDcaCount = (accountId: number) =>
    dcaRecords.filter((r) => r.accountId === accountId).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">계좌 관리</h2>

      <div className="grid gap-4">
        {accounts.map((account) => {
          const invested = getDcaTotal(account.id)
          const count = getDcaCount(account.id)
          const limit = account.annualLimit
          const ratio = limit ? Math.min((invested / limit) * 100, 100) : 0
          const remaining = limit ? Math.max(limit - invested, 0) : null

          return (
            <div key={account.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{account.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {ACCOUNT_TYPE_LABEL[account.accountType]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    {(invested / 10000).toLocaleString()}만원
                  </p>
                  {limit && (
                    <p className="text-sm text-gray-400">
                      한도 {(limit / 10000).toLocaleString()}만원
                    </p>
                  )}
                </div>
              </div>

              {limit ? (
                <>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: ratio >= 100 ? '#10b981' : ratio >= 80 ? '#f59e0b' : '#3b82f6',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Math.round(ratio)}% 소진</span>
                    <span>잔여 {((remaining || 0) / 10000).toLocaleString()}만원</span>
                  </div>
                </>
              ) : null}

              <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
                <span>올해 {count}회 입금</span>
                {count > 0 && <span>평균 {(invested / count / 10000).toLocaleString()}만원/회</span>}
              </div>
            </div>
          )
        })}
      </div>

      <AccountForm userId={USER_ID} onCreated={() => setRefreshKey((k) => k + 1)} />
    </div>
  )
}
