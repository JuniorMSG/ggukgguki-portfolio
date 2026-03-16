import { useEffect, useState } from 'react'
import { requestApi } from '../api'
import { useAuth } from '../contexts/AuthContext'

// AuthContext에서 user 객체 대신 isAuthenticated/userId 사용
import type { BoardRequest, BoardComment } from '../types'

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'FEATURE', label: '기능 요청' },
  { value: 'BUG', label: '버그' },
  { value: 'IMPROVEMENT', label: '개선' },
  { value: 'OTHER', label: '기타' },
]

const STATUSES = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '접수' },
  { value: 'REVIEWING', label: '검토중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'DONE', label: '완료' },
  { value: 'ON_HOLD', label: '보류' },
]

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-600',
  REVIEWING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-red-100 text-red-600',
}

const CATEGORY_LABELS: Record<string, string> = {
  FEATURE: '기능 요청', BUG: '버그', IMPROVEMENT: '개선', OTHER: '기타',
}

// ─── 상세 페이지 ───
function RequestDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { isAuthenticated, userId } = useAuth()
  const [request, setRequest] = useState<BoardRequest | null>(null)
  const [comments, setComments] = useState<BoardComment[]>([])
  const [newComment, setNewComment] = useState('')

  const load = () => {
    requestApi.getById(id).then(setRequest).catch(() => {})
    requestApi.getComments(id).then(setComments).catch(() => {})
  }

  useEffect(load, [id])

  const handleVote = async (voteType: string) => {
    if (!isAuthenticated) return
    const updated = await requestApi.vote(id, voteType)
    setRequest(updated)
  }

  const handleComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return
    await requestApi.createComment(id, newComment.trim())
    setNewComment('')
    load()
  }

  if (!request) return <div className="text-center py-8 text-gray-400">로딩중...</div>

  return (
    <div className="space-y-4">
      <button onClick={onBack}
        className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">← 목록</button>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[request.status]}`}>
            {STATUSES.find((s) => s.value === request.status)?.label}
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
            {CATEGORY_LABELS[request.category]}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{request.title}</h2>
        <div className="flex gap-3 text-xs text-gray-400 mb-4">
          <span>{request.authorNickname}</span>
          <span>{request.createdAt.split('T')[0]}</span>
          <span>조회 {request.viewCount}</span>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{request.content}</div>

        {/* 좋아요/싫어요 */}
        <div className="flex gap-3">
          <button onClick={() => handleVote('LIKE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              request.myVote === 'LIKE' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
            }`}>
            👍 {request.likeCount}
          </button>
          <button onClick={() => handleVote('DISLIKE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              request.myVote === 'DISLIKE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'
            }`}>
            👎 {request.dislikeCount}
          </button>
        </div>
      </div>

      {/* 댓글 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3">💬 댓글 ({comments.length})</h3>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className={`p-3 rounded-lg ${c.isAdminReply ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {c.isAdminReply && <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded mr-1">관리자</span>}
                  {c.authorNickname}
                </span>
                <span className="text-xs text-gray-400">{c.createdAt.split('T')[0]}</span>
                {isAuthenticated && c.authorId === userId && (
                  <button onClick={async () => { await requestApi.deleteComment(c.id); load() }}
                    className="text-xs text-gray-300 hover:text-red-400 ml-auto">삭제</button>
                )}
              </div>
              <p className="text-sm text-gray-600">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-gray-400">아직 댓글이 없습니다</p>}
        </div>

        {isAuthenticated && (
          <div className="flex gap-2">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="댓글을 입력하세요..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button onClick={handleComment}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">작성</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 작성 폼 ───
function RequestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('FEATURE')

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    await requestApi.create({ title: title.trim(), content: content.trim(), category })
    onCreated()
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">새 요청 작성</h2>
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-300">
        <option value="FEATURE">기능 요청</option>
        <option value="BUG">버그 신고</option>
        <option value="IMPROVEMENT">개선 제안</option>
        <option value="OTHER">기타</option>
      </select>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="제목" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..." rows={6}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">등록</button>
        <button onClick={onCancel} className="px-6 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg hover:bg-gray-200">취소</button>
      </div>
    </div>
  )
}

// ─── 메인 ───
export default function RequestsPage() {
  const { isAuthenticated, userId } = useAuth()
  const [requests, setRequests] = useState<BoardRequest[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = () => {
    requestApi.getAll({
      category: category || undefined,
      status: status || undefined,
      keyword: keyword || undefined,
      page,
    }).then((res) => {
      setRequests(res.content)
      setTotalPages(res.totalPages)
    }).catch(() => {})
  }

  useEffect(load, [category, status, keyword, page])

  if (selectedId) {
    return <RequestDetail id={selectedId} onBack={() => { setSelectedId(null); load() }} />
  }

  if (showForm) {
    return <RequestForm onCreated={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">요청사항</h2>
        {isAuthenticated && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">+ 새 요청</button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap items-center">
        <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
          placeholder="검색..." className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => { setCategory(c.value); setPage(0) }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                category === c.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>{c.label}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(0) }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                status === s.value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400">요청사항이 없습니다</div>
        ) : requests.map((r) => (
          <div key={r.id} onClick={() => setSelectedId(r.id)}
            className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                {CATEGORY_LABELS[r.category]}
              </span>
              <span className="text-sm font-medium text-gray-800 flex-1">{r.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                {STATUSES.find((s) => s.value === r.status)?.label}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <span>{r.authorNickname}</span>
              <span>{r.createdAt.split('T')[0]}</span>
              <span>👍 {r.likeCount}</span>
              {r.dislikeCount > 0 && <span>👎 {r.dislikeCount}</span>}
              <span>조회 {r.viewCount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
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
