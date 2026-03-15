import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface DropdownGroup {
  label: string
  links: { to: string; label: string }[]
}

const boardLinks: DropdownGroup = {
  label: '게시판',
  links: [
    { to: '/notices', label: '공지사항' },
    { to: '/requests', label: '요청사항' },
  ],
}

const assetLinks: DropdownGroup = {
  label: '자산관리',
  links: [
    { to: '/dashboard', label: '대시보드' },
    { to: '/assets', label: '자산' },
    { to: '/allocation', label: '자산배분' },
    { to: '/dca', label: 'DCA' },
    { to: '/cashflow', label: '수입/지출' },
  ],
}


function Dropdown({ group, isOpen, onToggle, onClose }: {
  group: DropdownGroup
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onBlur={() => setTimeout(onClose, 150)}
        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
          isOpen
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        {group.label} ▾
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Nav() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { isAuthenticated, nickname, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggle = (menu: string) => setOpenMenu(openMenu === menu ? null : menu)
  const close = () => setOpenMenu(null)

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">꾹꾹이</Link>
          <nav className="flex gap-1 items-center">
            {/* 로그인 상태에서만: 게시판, 대시보드, 자산관리 */}
            {isAuthenticated && (
              <>
                <Dropdown group={boardLinks} isOpen={openMenu === 'board'} onToggle={() => toggle('board')} onClose={close} />
                <Dropdown group={assetLinks} isOpen={openMenu === 'asset'} onToggle={() => toggle('asset')} onClose={close} />
              </>
            )}

            {/* 계산기 — 항상 노출, 드롭다운 없이 바로 이동 */}
            <NavLink
              to="/calculator"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              계산기
            </NavLink>

            {/* 유저 영역 */}
            <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {nickname}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  로그인
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
