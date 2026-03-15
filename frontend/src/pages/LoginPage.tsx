import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const nav = useNavigate()
  useEffect(() => { if (isAuthenticated) nav('/dashboard') }, [isAuthenticated, nav])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 맞지 않아요')
    }
  }

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setError('')
    if (!credentialResponse.credential) return
    try {
      await googleLogin(credentialResponse.credential)
      navigate('/')
    } catch {
      setError('구글 로그인에 실패했어요')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">꾹꾹이</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        {/* 구글 로그인 */}
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('구글 로그인에 실패했어요')}
            width="320"
          />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* 이메일 로그인 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          계정이 없나요?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
