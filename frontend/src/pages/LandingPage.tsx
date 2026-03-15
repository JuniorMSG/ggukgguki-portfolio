import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const features = [
  {
    group: '자산관리',
    items: [
      { icon: '📊', label: '대시보드', desc: '총자산, 수익률, 배당, 투자현황, 주간추이' },
      { icon: '💼', label: '자산', desc: '투자계좌, 현금성 자산, 보유종목 현황' },
      { icon: '🎯', label: '자산배분', desc: '목표 비중 설정, 자산군별 포트폴리오' },
      { icon: '📈', label: 'DCA', desc: '적립식 투자 기록, 연도별/계좌별 현황' },
      { icon: '💰', label: '수입/지출', desc: '월별/연간 추적, 카테고리별 분석' },
    ],
  },
  {
    group: '게시판',
    items: [
      { icon: '📢', label: '공지사항', desc: '서비스 업데이트, 공지 확인' },
      { icon: '💬', label: '요청사항', desc: '기능 요청, 피드백 남기기' },
    ],
  },
]

const calcTools = [
  { to: '/calculator/tax', label: '세금 시뮬레이터', desc: '금융소득 종합과세, 양도세 시뮬레이션' },
  { to: '/calculator/salary', label: '연봉 계산기', desc: '실수령액, 4대보험, 세금 계산' },
  { to: '/calculator/freelancer', label: '프리랜서 세금', desc: '3.3% 원천징수, 종합소득세 계산' },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-12 py-6">
      {/* 히어로 */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">꾹꾹이</h1>
        <p className="text-lg text-gray-500 mb-2">투자 포트폴리오 & 자산 관리</p>
        <p className="text-sm text-gray-400 mb-8">계좌별 투자 현황, DCA 추적, 자산배분까지 한곳에서</p>
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            대시보드로 이동
          </Link>
        ) : (
          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              시작하기
            </Link>
            <Link
              to="/calculator"
              className="px-8 py-3 bg-white text-gray-600 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              계산기 먼저 써보기
            </Link>
          </div>
        )}
      </div>

      {/* 주요 기능 — Nav 구조별 */}
      {features.map((section) => (
        <div key={section.group}>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{section.group}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {section.items.map((f) => (
              <div key={f.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.label}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 무료 계산기 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">무료 계산기</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">로그인 없이 바로 사용 가능</p>
        <div className="grid grid-cols-3 gap-4">
          {calcTools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-center"
            >
              <h3 className="font-semibold text-gray-800 mb-2">{tool.label}</h3>
              <p className="text-sm text-gray-500">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
