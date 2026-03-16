import { useEffect, useState } from 'react'
import { noticeApi } from '../api'
import type { Notice } from '../types'

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [selected, setSelected] = useState<Notice | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    noticeApi.getAll(page).then((res) => {
      setNotices(res.content)
      setTotalPages(res.totalPages)
    }).catch(() => {})
  }, [page])

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">← 목록</button>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            {selected.isPinned && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">고정</span>}
            <h2 className="text-xl font-bold text-gray-800">{selected.title}</h2>
          </div>
          <div className="flex gap-3 text-xs text-gray-400 mb-4">
            <span>{selected.authorNickname}</span>
            <span>{selected.createdAt.split('T')[0]}</span>
            <span>조회 {selected.viewCount}</span>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.content}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">공지사항</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {notices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">공지사항이 없습니다</div>
        ) : notices.map((n) => (
          <div key={n.id} onClick={() => {
            noticeApi.getById(n.id).then(setSelected).catch(() => {})
          }}
            className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              {n.isPinned && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">📌 고정</span>}
              <span className="text-sm font-medium text-gray-800">{n.title}</span>
            </div>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span>{n.authorNickname}</span>
              <span>{n.createdAt.split('T')[0]}</span>
              <span>조회 {n.viewCount}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`px-3 py-1.5 rounded text-sm ${page === i ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
