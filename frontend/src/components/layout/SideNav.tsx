import { NavLink, useLocation } from 'react-router-dom'

const groups: Record<string, { label: string; links: { to: string; label: string; icon: string }[] }> = {
  asset: {
    label: '자산관리',
    links: [
      { to: '/dashboard', label: '대시보드', icon: '📊' },
      { to: '/assets', label: '자산', icon: '💼' },
      { to: '/allocation', label: '자산배분', icon: '🎯' },
      { to: '/dca', label: 'DCA', icon: '📈' },
      { to: '/cashflow', label: '수입/지출', icon: '💰' },
    ],
  },
  board: {
    label: '게시판',
    links: [
      { to: '/notices', label: '공지사항', icon: '📢' },
      { to: '/requests', label: '요청사항', icon: '💬' },
    ],
  },
  calculator: {
    label: '계산기',
    links: [
      { to: '/calculator', label: '전체', icon: '🔢' },
      { to: '/calculator/tax', label: '세금 시뮬', icon: '🧾' },
      { to: '/calculator/salary', label: '연봉', icon: '💵' },
      { to: '/calculator/freelancer', label: '프리랜서', icon: '🧑‍💻' },
    ],
  },
}

const pathToGroup: Record<string, string> = {}
Object.entries(groups).forEach(([key, group]) => {
  group.links.forEach((link) => {
    pathToGroup[link.to] = key
  })
})

export default function SideNav() {
  const location = useLocation()

  const currentGroup = Object.entries(pathToGroup).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1]

  if (!currentGroup) return null

  const group = groups[currentGroup]

  return (
    <nav className="sticky top-20">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-3 px-2">
          {group.label}
        </p>
        <div className="space-y-0.5">
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/calculator'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm border border-blue-100'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
