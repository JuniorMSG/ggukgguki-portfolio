import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const mainLinks = [
  { to: '/', label: '대시보드' },
  { to: '/accounts', label: '계좌' },
  { to: '/assets', label: '자산배분' },
  { to: '/dca', label: 'DCA' },
  { to: '/cashflow', label: '수입/지출' },
]

const calcLinks = [
  { to: '/tax', label: '세금 시뮬' },
  { to: '/salary', label: '연봉' },
  { to: '/freelancer', label: '프리랜서' },
]

export default function Nav() {
  const [calcOpen, setCalcOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-bold text-gray-800">꾹꾹이</h1>
          <nav className="flex gap-1 items-center">
            {mainLinks.map((link) => (
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

            {/* 계산기 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setCalcOpen(!calcOpen)}
                onBlur={() => setTimeout(() => setCalcOpen(false), 150)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  calcOpen
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                계산기 ▾
              </button>
              {calcOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
                  {calcLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setCalcOpen(false)}
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
          </nav>
        </div>
      </div>
    </header>
  )
}
