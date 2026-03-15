import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const { nickname: currentNickname, setNickname: saveNickname, logout } = useAuth()
  const [nickname, setNickname] = useState(currentNickname || '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || nickname.trim() === currentNickname) return
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      await saveNickname(nickname.trim())
      setSaved(true)
    } catch {
      setError('닉네임 변경에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">프로필 설정</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setSaved(false) }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">저장되었어요</p>}
          <button
            type="submit"
            disabled={loading || !nickname.trim() || nickname.trim() === currentNickname}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '저장 중...' : '닉네임 변경'}
          </button>
        </form>
      </div>

      <div className="max-w-md">
        <button
          onClick={logout}
          className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
