import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function NicknameModal() {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setNickname: saveNickname } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setLoading(true)
    setError('')
    try {
      await saveNickname(nickname.trim())
    } catch {
      setError('닉네임 설정에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">환영해요!</h2>
        <p className="text-sm text-gray-500 text-center mb-6">사용할 닉네임을 설정해주세요</p>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '설정 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
