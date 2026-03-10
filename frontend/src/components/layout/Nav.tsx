import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '대시보드' },
  { to: '/accounts', label: '계좌' },
  { to: '/assets', label: '자산배분' },
  { to: '/dca', label: 'DCA' },
  { to: '/cashflow', label: '수입/지출' },
]

export default function Nav() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-bold text-gray-800">꾹꾹이</h1>
          <nav className="flex gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
