import { useEffect, useState, useRef } from 'react'
import { noticeApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import type { Notice } from '../types'

export default function NoticesPage() {
  const { isAdmin } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Notice | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const viewedRef = useRef<Set<number>>(new Set())

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formPinned, setFormPinned] = useState(false)

  const load = () => {
    noticeApi.getAll(page).then((res) => {
      setNotices(res.content)
      setTotalPages(res.totalPages)
    }).catch(() => {})
  }

  useEffect(load, [page])

  // 상세 진입 시 조회수 증가 (세션 내 1회만)
  useEffect(() => {
    if (selectedId && !viewedRef.current.has(selectedId)) {
      viewedRef.current.add(selectedId)
      noticeApi.getById(selectedId).then(setDetail).catch(() => {})
    } else if (selectedId) {
      // 이미 조회한 글은 목록 데이터에서 가져옴
      const found = notices.find((n) => n.id === selectedId)
      if (found) setDetail(found)
    }
  }, [selectedId])

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    await noticeApi.create({ title: formTitle.trim(), content: formContent.trim(), isPinned: formPinned })
    setFormTitle('')
    setFormContent('')
    setFormPinned(false)
    setShowForm(false)
    load()
  }

  if (detail && selectedId) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedId(null); setDetail(null) }}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">← 목록</button>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            {detail.isPinned && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">📌 고정</span>}
            <h2 className="text-xl font-bold text-gray-800">{detail.title}</h2>
          </div>
          <div className="flex gap-3 text-xs text-gray-400 mb-4">
            <span>{detail.authorNickname}</span>
            <span>{detail.createdAt.split('T')[0]}</span>
            <span>조회 {detail.viewCount}</span>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detail.content}</div>

          {isAdmin && (
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
              <button onClick={async () => { await noticeApi.delete(detail.id); setSelectedId(null); setDetail(null); load() }}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200">삭제</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <button onClick={() => setShowForm(false)}
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">← 취소</button>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">공지사항 작성</h2>
          <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
            placeholder="제목" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)}
            placeholder="내용을 입력하세요..." rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} />
            상단 고정
          </label>
          <button onClick={handleCreate}
            className="px-6 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">등록</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">공지사항</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">+ 공지 작성</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {notices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">공지사항이 없습니다</div>
        ) : notices.map((n) => (
          <div key={n.id} onClick={() => setSelectedId(n.id)}
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
