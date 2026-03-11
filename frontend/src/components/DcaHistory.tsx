import { useEffect, useState } from 'react'
import { dcaApi } from '../api'
import type { DcaRecord } from '../types'

interface Props {
  refreshKey: number
}

export default function DcaHistory({ refreshKey }: Props) {
  const [records, setRecords] = useState<DcaRecord[]>([])
  const year = new Date().getFullYear()

  useEffect(() => {
    dcaApi.getByYear(year).then((list) =>
      setRecords(list.sort((a, b) => b.recordDate.localeCompare(a.recordDate)))
    )
  }, [refreshKey, year])

  if (records.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-3">최근 기록</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {records.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="text-sm">
              <span className="text-gray-600">{r.recordDate}</span>
              {r.memo && <span className="ml-2 text-gray-400">{r.memo}</span>}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {r.amount.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
