import { useEffect, useState } from 'react'
import { assetClassApi } from '../api'
import type { Allocation } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6']

interface Props {
  userId: number
}

export default function AssetRatioChart({ userId }: Props) {
  const [allocations, setAllocations] = useState<Allocation[]>([])

  useEffect(() => {
    assetClassApi.getAllocations(userId).then(setAllocations).catch(() => {})
  }, [userId])

  if (allocations.length === 0) return null

  const total = allocations.reduce((sum, a) => sum + a.targetRatio, 0)

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-3">목표 자산 비중</h2>

      {/* 바 차트 */}
      <div className="flex rounded-full h-6 overflow-hidden">
        {allocations.map((alloc, i) => {
          if (alloc.targetRatio === 0) return null
          return (
            <div
              key={alloc.id}
              className="h-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (alloc.targetRatio / total) * 100 : 0}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
              title={`${alloc.assetClassName}: ${alloc.targetRatio}%`}
            />
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {allocations.map((alloc, i) => (
          <div key={alloc.id} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-gray-600">
              {alloc.parentName ? `${alloc.parentName} > ` : ''}{alloc.assetClassName}
            </span>
            <span className="text-gray-400">{alloc.targetRatio}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
