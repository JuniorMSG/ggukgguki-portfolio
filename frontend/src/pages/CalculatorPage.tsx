import { Link } from 'react-router-dom'

const calculators = [
  {
    to: '/calculator/tax',
    icon: '🧾',
    label: '세금 시뮬레이터',
    desc: '금융소득 종합과세, 양도세 등을 시뮬레이션해보세요',
    color: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    to: '/calculator/salary',
    icon: '💵',
    label: '연봉 계산기',
    desc: '연봉별 실수령액, 4대보험, 소득세를 계산해보세요',
    color: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-100',
    hoverBorder: 'hover:border-green-300',
  },
  {
    to: '/calculator/freelancer',
    icon: '🧑‍💻',
    label: '프리랜서 세금',
    desc: '3.3% 원천징수, 종합소득세, 실수령액을 계산해보세요',
    color: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-100',
    hoverBorder: 'hover:border-amber-300',
  },
]

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">계산기</h2>
        <p className="text-sm text-gray-500 mt-1">로그인 없이 무료로 사용할 수 있어요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {calculators.map((calc) => (
          <Link
            key={calc.to}
            to={calc.to}
            className={`bg-gradient-to-br ${calc.color} rounded-xl p-6 shadow-sm border ${calc.borderColor} ${calc.hoverBorder} hover:shadow-md transition-all`}
          >
            <div className="text-3xl mb-3">{calc.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{calc.label}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
