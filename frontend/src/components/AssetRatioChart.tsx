import { useEffect, useState } from 'react'
import { assetClassApi } from '../api'
import type { AssetClass } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6']

export default function AssetRatioChart() {
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([])

  useEffect(() => {
    assetClassApi.getAll().then(setAssetClasses).catch(() => {})
  }, [])

  if (assetClasses.length === 0) return null

  const total = assetClasses.reduce((sum, ac) => sum + (ac.targetRatio || 0), 0)

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-3">목표 자산 비중</h2>

      <div className="flex items-center gap-4">
        {/* 바 차트 */}
        <div className="flex-1">
          <div className="flex rounded-full h-6 overflow-hidden">
            {assetClasses.map((ac, i) => {
              const ratio = ac.targetRatio || 0
              if (ratio === 0) return null
              return (
                <div
                  key={ac.id}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? (ratio / total) * 100 : 0}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                  title={`${ac.name}: ${ratio}%`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {assetClasses.map((ac, i) => (
          <div key={ac.id} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-gray-600">{ac.name}</span>
            <span className="text-gray-400">{ac.targetRatio || 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
