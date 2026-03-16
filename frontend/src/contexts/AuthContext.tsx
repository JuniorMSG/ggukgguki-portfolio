import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi, userApi } from '../api'

interface AuthState {
  isAuthenticated: boolean
  userId: number | null
  nickname: string | null
  role: string | null
  isAdmin: boolean
  needsNickname: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, nickname: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  setNickname: (nickname: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [needsNickname, setNeedsNickname] = useState(false)

  const isAdmin = role === 'ADMIN'

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const savedUserId = localStorage.getItem('userId')
    const savedNickname = localStorage.getItem('nickname')
    const savedRole = localStorage.getItem('role')
    if (token && savedUserId) {
      setIsAuthenticated(true)
      setUserId(Number(savedUserId))
      setNickname(savedNickname)
      setRole(savedRole)
    }
  }, [])

  const saveAuth = (res: { accessToken: string; refreshToken: string; userId: number; nickname: string; role?: string }) => {
    localStorage.setItem('accessToken', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
    localStorage.setItem('userId', String(res.userId))
    localStorage.setItem('nickname', res.nickname)
    localStorage.setItem('role', res.role || 'USER')
    setIsAuthenticated(true)
    setUserId(res.userId)
    setNickname(res.nickname)
    setRole(res.role || 'USER')
  }

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    saveAuth(res)
  }

  const signup = async (email: string, password: string, nickname: string) => {
    const res = await authApi.signup(email, password, nickname)
    saveAuth(res)
  }

  const googleLogin = async (credential: string) => {
    const res = await authApi.google(credential)
    saveAuth(res)
    if (res.isNewUser) {
      setNeedsNickname(true)
    }
  }

  const handleSetNickname = async (newNickname: string) => {
    const res = await userApi.setNickname(newNickname)
    saveAuth(res)
    setNeedsNickname(false)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('nickname')
    setIsAuthenticated(false)
    setUserId(null)
    setNickname(null)
    setRole(null)
    setNeedsNickname(false)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated, userId, nickname, role, isAdmin, needsNickname,
      login, signup, googleLogin, setNickname: handleSetNickname, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
