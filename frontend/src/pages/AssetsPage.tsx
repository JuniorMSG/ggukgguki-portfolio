import { useEffect, useState } from 'react'
import { assetClassApi } from '../api'
import type { Allocation, AssetClass } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const USER_ID = 1
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function AssetsPage() {
  const [allClasses, setAllClasses] = useState<AssetClass[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])

  useEffect(() => {
    assetClassApi.getAll().then(setAllClasses)
    assetClassApi.getAllocations(USER_ID).then(setAllocations).catch(() => {})
  }, [])

  // 대분류 → 소분류 트리 구성
  const categories = allClasses.filter((c) => c.parentId === null)
  const getChildren = (parentId: number) => allClasses.filter((c) => c.parentId === parentId)

  const pieData = allocations
    .filter((a) => a.targetRatio > 0)
    .map((a) => ({ name: a.assetClassName, value: a.targetRatio }))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">자산배분</h2>

      {/* 파이차트 */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-2">내 목표 비중</h3>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {allocations
                .filter((a) => a.targetRatio > 0)
                .map((alloc, i) => (
                  <div key={alloc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700">
                        {alloc.parentName && <span className="text-gray-400">{alloc.parentName} &gt; </span>}
                        {alloc.assetClassName}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{alloc.targetRatio}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 자산군 마스터 트리 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">자산군 분류 체계</h3>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => {
            const children = getChildren(cat.id)
            return (
              <div key={cat.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-800 mb-1">{cat.name}</p>
                {children.length > 0 ? (
                  <div className="space-y-1">
                    {children.map((child) => {
                      const alloc = allocations.find((a) => a.assetClassId === child.id)
                      return (
                        <div key={child.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{child.name}</span>
                          {alloc ? (
                            <span className="text-blue-600 font-medium">{alloc.targetRatio}%</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">소분류 없음</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
