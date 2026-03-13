import { useState, useMemo } from 'react'

// ══════════════════════════════════════════════
// 연도별 프리랜서 세금 설정
// ══════════════════════════════════════════════

interface FreelancerConfig {
  year: number
  withholdingRate: number           // 원천징수율 (3.3% = 소득세3% + 지방세0.3%)
  incomeTaxBrackets: { limit: number; rate: number; deduction: number }[]
  localIncomeTaxRate: number
  // 경비율 (업종코드 940909 기준)
  simpleExpenseRate: number         // 단순경비율
  standardExpenseRate: number       // 기준경비율
  simpleExpenseThreshold: number    // 단순경비율 적용 수입 상한
  // 건강보험 (지역가입자)
  healthInsuranceRate: number
  longTermCareRate: number
  // 국민연금 (지역가입자)
  nationalPensionRate: number       // 전액 본인 부담
  nationalPensionCeilMonthly: number
  nationalPensionFloorMonthly: number
  notes: string[]
}

const FREELANCER_CONFIGS: Record<number, FreelancerConfig> = {
  2025: {
    year: 2025,
    withholdingRate: 0.033,
    incomeTaxBrackets: [
      { limit: 14_000_000,    rate: 0.06, deduction: 0 },
      { limit: 50_000_000,    rate: 0.15, deduction: 1_260_000 },
      { limit: 88_000_000,    rate: 0.24, deduction: 5_760_000 },
      { limit: 150_000_000,   rate: 0.35, deduction: 15_440_000 },
      { limit: 300_000_000,   rate: 0.38, deduction: 19_940_000 },
      { limit: 500_000_000,   rate: 0.40, deduction: 25_940_000 },
      { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
      { limit: Infinity,      rate: 0.45, deduction: 65_940_000 },
    ],
    localIncomeTaxRate: 0.10,
    simpleExpenseRate: 0.641,
    standardExpenseRate: 0.173,
    simpleExpenseThreshold: 24_000_000,
    healthInsuranceRate: 0.0709,
    longTermCareRate: 0.1295,
    nationalPensionRate: 0.09,
    nationalPensionCeilMonthly: 6_170_000,
    nationalPensionFloorMonthly: 390_000,
    notes: ['건보 7.09%', '장기요양 건보의 12.95%', '국민연금 9% (전액 본인)'],
  },
  2026: {
    year: 2026,
    withholdingRate: 0.033,
    incomeTaxBrackets: [
      { limit: 14_000_000,    rate: 0.06, deduction: 0 },
      { limit: 50_000_000,    rate: 0.15, deduction: 1_260_000 },
      { limit: 88_000_000,    rate: 0.24, deduction: 5_760_000 },
      { limit: 150_000_000,   rate: 0.35, deduction: 15_440_000 },
      { limit: 300_000_000,   rate: 0.38, deduction: 19_940_000 },
      { limit: 500_000_000,   rate: 0.40, deduction: 25_940_000 },
      { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
      { limit: Infinity,      rate: 0.45, deduction: 65_940_000 },
    ],
    localIncomeTaxRate: 0.10,
    simpleExpenseRate: 0.641,
    standardExpenseRate: 0.173,
    simpleExpenseThreshold: 24_000_000,
    healthInsuranceRate: 0.0719,
    longTermCareRate: 0.1314,
    nationalPensionRate: 0.095,
    nationalPensionCeilMonthly: 6_370_000,
    nationalPensionFloorMonthly: 400_000,
    notes: [
      '건보 7.09% → 7.19%',
      '장기요양 건보의 12.95% → 13.14%',
      '국민연금 9% → 9.5% (전액 본인)',
      '국민연금 상한 617만 → 637만',
    ],
  },
}

// ══════════════════════════════════════════════
// 계산
// ══════════════════════════════════════════════

function calcIncomeTax(taxable: number, cfg: FreelancerConfig): number {
  if (taxable <= 0) return 0
  for (const b of cfg.incomeTaxBrackets) {
    if (taxable <= b.limit) return Math.max(taxable * b.rate - b.deduction, 0)
  }
  return 0
}

interface CalcResult {
  revenue: number
  withheld: number              // 이미 원천징수된 금액 (3.3%)
  expenseType: string
  expenseRate: number
  expenses: number
  taxableIncome: number
  incomeTax: number
  localTax: number
  totalTax: number
  refundOrPay: number           // 양수=환급, 음수=추가납부
  // 사회보험 (지역가입자, 연간)
  pension: number
  health: number
  longTermCare: number
  totalInsurance: number
  // 최종
  netIncome: number             // 수입 - 세금 - 사회보험
  effectiveRate: number
}

function calculate(revenue: number, useSimple: boolean, cfg: FreelancerConfig): CalcResult {
  const withheld = Math.round(revenue * cfg.withholdingRate)

  // 경비 계산
  const canUseSimple = revenue <= cfg.simpleExpenseThreshold
  const actualSimple = canUseSimple && useSimple
  const expenseRate = actualSimple ? cfg.simpleExpenseRate : cfg.standardExpenseRate
  const expenseType = actualSimple ? '단순경비율' : '기준경비율'
  const expenses = Math.round(revenue * expenseRate)

  // 소득금액
  const incomeAmount = revenue - expenses

  // 소득공제 (인적공제 본인 150만 + 표준공제 7만)
  const personalDeduction = 1_500_000
  const standardDeduction = 70_000
  const taxableIncome = Math.max(incomeAmount - personalDeduction - standardDeduction, 0)

  // 종합소득세
  const incomeTax = Math.round(calcIncomeTax(taxableIncome, cfg))
  const localTax = Math.round(incomeTax * cfg.localIncomeTaxRate)
  const totalTax = incomeTax + localTax

  // 환급 or 추가납부
  const refundOrPay = withheld - totalTax // 양수=환급

  // 사회보험 (지역가입자: 전액 본인 부담)
  const monthlyIncome = incomeAmount / 12
  const pensionBase = Math.max(Math.min(monthlyIncome, cfg.nationalPensionCeilMonthly), cfg.nationalPensionFloorMonthly)
  const pension = Math.round(pensionBase * cfg.nationalPensionRate) * 12
  const health = Math.round(incomeAmount * cfg.healthInsuranceRate)
  const longTermCare = Math.round(health * cfg.longTermCareRate)
  const totalInsurance = pension + health + longTermCare

  const netIncome = revenue - totalTax - totalInsurance
  const effectiveRate = revenue > 0 ? ((totalTax + totalInsurance) / revenue) * 100 : 0

  return {
    revenue, withheld, expenseType, expenseRate, expenses, taxableIncome,
    incomeTax, localTax, totalTax, refundOrPay,
    pension, health, longTermCare, totalInsurance,
    netIncome, effectiveRate,
  }
}

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`
  return Math.round(n).toLocaleString() + '원'
}

function fmtWon(n: number): string {
  return Math.round(n).toLocaleString() + '원'
}

const AVAILABLE_YEARS = Object.keys(FREELANCER_CONFIGS).map(Number).sort((a, b) => b - a)

const PRESETS = [
  { label: '2천만', value: 20_000_000 },
  { label: '3천만', value: 30_000_000 },
  { label: '5천만', value: 50_000_000 },
  { label: '7천만', value: 70_000_000 },
  { label: '1억', value: 100_000_000 },
  { label: '1.5억', value: 150_000_000 },
  { label: '2억', value: 200_000_000 },
]

export default function FreelancerCalcPage() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const [revenue, setRevenue] = useState(70_000_000)
  const [showRates, setShowRates] = useState(false)

  const cfg = FREELANCER_CONFIGS[selectedYear]
  const canUseSimple = revenue <= cfg.simpleExpenseThreshold

  const simpleResult = useMemo(() => calculate(revenue, true, cfg), [revenue, cfg])
  const standardResult = useMemo(() => calculate(revenue, false, cfg), [revenue, cfg])
  const betterResult = simpleResult.netIncome >= standardResult.netIncome ? simpleResult : standardResult

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">프리랜서 세금 계산기</h2>
        <div className="flex items-center gap-2">
          {AVAILABLE_YEARS.map((y) => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedYear === y ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {y}년
            </button>
          ))}
        </div>
      </div>

      {/* 변경사항 */}
      {cfg.notes.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="text-xs font-medium text-amber-700 mb-1">{cfg.year}년 변경사항</div>
          {cfg.notes.map((n, i) => <div key={i} className="text-xs text-amber-600">• {n}</div>)}
        </div>
      )}

      {/* 요율 기준 (토글) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setShowRates(!showRates)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <span>세율 및 경비율 기준 ({cfg.year}년)</span>
          <span className="text-gray-400">{showRates ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        {showRates && (
          <div className="px-5 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">경비율 (업종 940909)</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>단순경비율</span><span className="font-medium">{(cfg.simpleExpenseRate * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>기준경비율</span><span className="font-medium">{(cfg.standardExpenseRate * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>단순경비율 한도</span><span className="font-medium">{fmt(cfg.simpleExpenseThreshold)}/년</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">사회보험 (지역가입자)</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>국민연금</span><span className="font-medium">{(cfg.nationalPensionRate * 100).toFixed(1)}% (전액)</span></div>
                  <div className="flex justify-between"><span>건강보험</span><span className="font-medium">{(cfg.healthInsuranceRate * 100).toFixed(2)}% (전액)</span></div>
                  <div className="flex justify-between"><span>장기요양</span><span className="font-medium">건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">종합소득세율</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 text-gray-400">과세표준</th>
                    <th className="text-right py-1 text-gray-400">세율</th>
                    <th className="text-right py-1 text-gray-400">지방세 포함</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {cfg.incomeTaxBrackets.map((b, i) => {
                    const prev = i === 0 ? 0 : cfg.incomeTaxBrackets[i - 1].limit
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1">{fmtLimit(prev)} ~ {b.limit === Infinity ? '' : fmtLimit(b.limit)}{b.limit === Infinity && '~'}</td>
                        <td className="text-right font-medium">{(b.rate * 100).toFixed(0)}%</td>
                        <td className="text-right text-blue-600 font-medium">{(b.rate * 1.1 * 100).toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연간 수입 (총 매출): <span className="text-blue-600 font-bold">{fmt(revenue)}</span>
            <span className="text-xs text-gray-400 ml-1">(월 {fmt(revenue / 12)})</span>
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {PRESETS.map((p) => (
              <button key={p.value} onClick={() => setRevenue(p.value)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${revenue === p.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="range" min={10_000_000} max={300_000_000} step={1_000_000}
            value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>3.3% 원천징수 기납부액</span>
            <span className="font-medium">{fmtWon(Math.round(revenue * cfg.withholdingRate))}</span>
          </div>
        </div>
      </div>

      {/* 단순 vs 기준 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[simpleResult, standardResult].map((r) => {
          const isBetter = r === betterResult
          const isDisabled = r === simpleResult && !canUseSimple

          return (
            <div key={r.expenseType}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                isDisabled ? 'border-gray-200 opacity-50' : isBetter ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isBetter && !isDisabled && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">유리</span>}
                  <span className="font-semibold text-gray-800">{r.expenseType}</span>
                  <span className="text-xs text-gray-400">({(r.expenseRate * 100).toFixed(1)}%)</span>
                </div>
                {isDisabled && <span className="text-xs text-red-400">수입 초과로 적용 불가</span>}
              </div>

              <div className="text-xs text-gray-500 space-y-0.5">
                <div className="flex justify-between"><span>수입</span><span>{fmt(r.revenue)}</span></div>
                <div className="flex justify-between"><span>필요경비 ({(r.expenseRate * 100).toFixed(1)}%)</span><span>-{fmt(r.expenses)}</span></div>
                <div className="flex justify-between"><span>소득금액</span><span>{fmt(r.revenue - r.expenses)}</span></div>
                <div className="flex justify-between"><span>과세표준</span><span>{fmt(r.taxableIncome)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-1"><span>종합소득세</span><span className="text-red-500">{fmtWon(r.incomeTax)}</span></div>
                <div className="flex justify-between"><span>지방소득세</span><span className="text-red-500">{fmtWon(r.localTax)}</span></div>
                <div className="flex justify-between font-medium"><span>세금 합계</span><span className="text-red-500">{fmtWon(r.totalTax)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-1">
                  <span>기납부 (3.3%)</span><span>{fmtWon(r.withheld)}</span>
                </div>
                <div className={`flex justify-between font-medium ${r.refundOrPay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{r.refundOrPay >= 0 ? '환급' : '추가납부'}</span>
                  <span>{r.refundOrPay >= 0 ? '+' : ''}{fmtWon(r.refundOrPay)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 최종 결과 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">최종 실수입 ({betterResult.expenseType} 기준)</h3>
        <div className="text-xs text-gray-500 space-y-0.5">
          <div className="flex justify-between"><span>연간 수입</span><span className="font-medium text-gray-700">{fmtWon(betterResult.revenue)}</span></div>
          <div className="flex justify-between"><span>종합소득세 + 지방세</span><span className="text-red-500">-{fmtWon(betterResult.totalTax)}</span></div>
          <div className="flex justify-between"><span>국민연금 ({(cfg.nationalPensionRate * 100).toFixed(1)}%)</span><span className="text-red-500">-{fmtWon(betterResult.pension)}</span></div>
          <div className="flex justify-between"><span>건강보험 ({(cfg.healthInsuranceRate * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmtWon(betterResult.health)}</span></div>
          <div className="flex justify-between"><span>장기요양 (건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmtWon(betterResult.longTermCare)}</span></div>
          <div className="flex justify-between border-t border-gray-100 pt-1 font-medium text-sm text-gray-800">
            <span>연 실수입</span><span>{fmtWon(betterResult.netIncome)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>월 실수입</span><span className="text-blue-600 font-bold text-sm">{fmtWon(betterResult.netIncome / 12)}</span>
          </div>
          <div className="flex justify-between">
            <span>실효 부담률 (세금+사회보험)</span><span className="text-red-500">{betterResult.effectiveRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* 바 차트 */}
        <div className="mt-4 w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
          <div className="h-3 bg-blue-500" style={{ width: `${(betterResult.netIncome / betterResult.revenue) * 100}%` }} />
          <div className="h-3 bg-red-400" style={{ width: `${(betterResult.totalTax / betterResult.revenue) * 100}%` }} />
          <div className="h-3 bg-orange-400" style={{ width: `${(betterResult.totalInsurance / betterResult.revenue) * 100}%` }} />
        </div>
        <div className="flex gap-4 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />실수입 {((betterResult.netIncome / betterResult.revenue) * 100).toFixed(0)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />세금 {((betterResult.totalTax / betterResult.revenue) * 100).toFixed(0)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />사회보험 {((betterResult.totalInsurance / betterResult.revenue) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 수입대별 비교표 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">수입대별 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-gray-500 font-medium">연수입</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">경비율</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">세금</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">사회보험</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">실수입</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">부담률</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((p) => {
                const s = calculate(p.value, true, cfg)
                const g = calculate(p.value, false, cfg)
                const r = s.netIncome >= g.netIncome ? s : g
                return (
                  <tr key={p.value} className={`border-b border-gray-50 ${revenue === p.value ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 px-1 font-medium text-gray-600">{p.label}</td>
                    <td className="text-right py-2 px-1 text-gray-500">{r.expenseType}</td>
                    <td className="text-right py-2 px-1 text-red-500">{fmt(r.totalTax)}</td>
                    <td className="text-right py-2 px-1 text-orange-500">{fmt(r.totalInsurance)}</td>
                    <td className="text-right py-2 px-1 text-gray-700 font-medium">{fmt(r.netIncome)}</td>
                    <td className="text-right py-2 px-1 text-red-500">{r.effectiveRate.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">* {cfg.year}년 요율 / 인적용역 940909 기준 / 유리한 경비율 자동 적용</p>
      </div>

      {/* 참고 */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">참고</p>
        <p>• 업종코드 940909 (컴퓨터 프로그래머 등 인적용역) 기준</p>
        <p>• 단순경비율 64.1% / 기준경비율 17.3% (업종별 상이)</p>
        <p>• 단순경비율은 연 수입 {fmt(cfg.simpleExpenseThreshold)} 이하만 적용 가능</p>
        <p>• 실제 경비 증빙이 기준경비율보다 크면 실제 경비로 신고가 유리</p>
        <p>• 지역가입자 건보료는 소득+재산 기반 (여기서는 소득만 반영)</p>
        <p>• 프리랜서도 연금저축/IRP 세액공제 가능 (절세 효과 미반영)</p>
      </div>
    </div>
  )
}

function fmtLimit(n: number): string {
  if (n === Infinity) return '초과'
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억`
  return `${(n / 10_000).toLocaleString()}만`
}
