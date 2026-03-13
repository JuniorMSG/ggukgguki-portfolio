import { useState, useMemo } from 'react'

// ══════════════════════════════════════════════
// 연도별 4대보험 + 세율
// ══════════════════════════════════════════════

interface SalaryConfig {
  year: number
  nationalPension: number           // 국민연금 근로자 부담분
  nationalPensionCeilMonthly: number // 기준소득월액 상한
  nationalPensionFloorMonthly: number// 기준소득월액 하한
  healthInsurance: number            // 건강보험 근로자 부담분
  longTermCareRate: number           // 장기요양 (건보의 %)
  employmentInsurance: number        // 고용보험 근로자 부담분
  localIncomeTaxRate: number         // 지방소득세율
  notes: string[]
}

const SALARY_CONFIGS: Record<number, SalaryConfig> = {
  2025: {
    year: 2025,
    nationalPension: 0.045,
    nationalPensionCeilMonthly: 6_170_000,
    nationalPensionFloorMonthly: 390_000,
    healthInsurance: 0.03545,
    longTermCareRate: 0.1295,
    employmentInsurance: 0.009,
    localIncomeTaxRate: 0.10,
    notes: ['국민연금 4.5% (9%의 절반)', '건보 3.545%', '장기요양 건보의 12.95%'],
  },
  2026: {
    year: 2026,
    nationalPension: 0.0475,
    nationalPensionCeilMonthly: 6_370_000,
    nationalPensionFloorMonthly: 400_000,
    healthInsurance: 0.03595,
    longTermCareRate: 0.1314,
    employmentInsurance: 0.009,
    localIncomeTaxRate: 0.10,
    notes: [
      '국민연금 4.5% → 4.75% (+0.25%p, 9% → 9.5%)',
      '건보 3.545% → 3.595% (+0.05%p)',
      '장기요양 건보의 12.95% → 13.14%',
      '국민연금 상한 617만 → 637만',
    ],
  },
}

// 근로소득공제
function calcEarnedIncomeDeduction(totalSalary: number): number {
  if (totalSalary <= 5_000_000) return totalSalary * 0.70
  if (totalSalary <= 15_000_000) return 3_500_000 + (totalSalary - 5_000_000) * 0.40
  if (totalSalary <= 45_000_000) return 7_500_000 + (totalSalary - 15_000_000) * 0.15
  if (totalSalary <= 100_000_000) return 12_000_000 + (totalSalary - 45_000_000) * 0.05
  return 14_750_000 + (totalSalary - 100_000_000) * 0.02
}

// 종합소득세 구간 (지방소득세 미포함)
const INCOME_TAX_BRACKETS = [
  { limit: 14_000_000,    rate: 0.06, deduction: 0 },
  { limit: 50_000_000,    rate: 0.15, deduction: 1_260_000 },
  { limit: 88_000_000,    rate: 0.24, deduction: 5_760_000 },
  { limit: 150_000_000,   rate: 0.35, deduction: 15_440_000 },
  { limit: 300_000_000,   rate: 0.38, deduction: 19_940_000 },
  { limit: 500_000_000,   rate: 0.40, deduction: 25_940_000 },
  { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { limit: Infinity,      rate: 0.45, deduction: 65_940_000 },
]

function calcIncomeTax(taxable: number): number {
  if (taxable <= 0) return 0
  for (const b of INCOME_TAX_BRACKETS) {
    if (taxable <= b.limit) return Math.max(taxable * b.rate - b.deduction, 0)
  }
  return 0
}

interface CalcResult {
  grossMonthly: number
  pension: number
  health: number
  longTermCare: number
  employment: number
  totalInsurance: number
  incomeTax: number
  localTax: number
  totalTax: number
  totalDeduction: number
  netMonthly: number
  netAnnual: number
  deductionRate: number
}

function calculate(annualSalary: number, dependents: number, cfg: SalaryConfig): CalcResult {
  const monthly = annualSalary / 12

  // 4대보험 (월 기준)
  const pensionBase = Math.max(Math.min(monthly, cfg.nationalPensionCeilMonthly), cfg.nationalPensionFloorMonthly)
  const pension = Math.round(pensionBase * cfg.nationalPension)
  const health = Math.round(monthly * cfg.healthInsurance)
  const longTermCare = Math.round(health * cfg.longTermCareRate)
  const employment = Math.round(monthly * cfg.employmentInsurance)
  const totalInsurance = pension + health + longTermCare + employment

  // 근로소득세 (연간 계산 → 월 환산)
  const earnedDeduction = calcEarnedIncomeDeduction(annualSalary)
  const personalDeduction = 1_500_000 * Math.max(dependents, 1) // 인적공제 (본인 포함)
  const insuranceDeduction = totalInsurance * 12 // 보험료 소득공제
  const standardDeduction = 130_000 // 표준세액공제 (13만원, 특별소득공제 미적용 시)

  const taxableIncome = Math.max(annualSalary - earnedDeduction - personalDeduction - insuranceDeduction, 0)
  const annualIncomeTax = Math.max(calcIncomeTax(taxableIncome) - standardDeduction, 0)
  const incomeTax = Math.round(annualIncomeTax / 12)
  const localTax = Math.round(incomeTax * cfg.localIncomeTaxRate)
  const totalTax = incomeTax + localTax

  const totalDeduction = totalInsurance + totalTax
  const netMonthly = monthly - totalDeduction

  return {
    grossMonthly: monthly,
    pension, health, longTermCare, employment,
    totalInsurance,
    incomeTax, localTax, totalTax,
    totalDeduction,
    netMonthly,
    netAnnual: netMonthly * 12,
    deductionRate: annualSalary > 0 ? (totalDeduction * 12 / annualSalary) * 100 : 0,
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

const AVAILABLE_YEARS = Object.keys(SALARY_CONFIGS).map(Number).sort((a, b) => b - a)

const PRESETS = [
  { label: '3천만', value: 30_000_000 },
  { label: '4천만', value: 40_000_000 },
  { label: '5천만', value: 50_000_000 },
  { label: '6천만', value: 60_000_000 },
  { label: '8천만', value: 80_000_000 },
  { label: '1억', value: 100_000_000 },
  { label: '1.5억', value: 150_000_000 },
  { label: '2억', value: 200_000_000 },
]

export default function SalaryCalcPage() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const [annualSalary, setAnnualSalary] = useState(50_000_000)
  const [dependents, setDependents] = useState(1)
  const [showRates, setShowRates] = useState(false)

  const cfg = SALARY_CONFIGS[selectedYear]
  const result = useMemo(() => calculate(annualSalary, dependents, cfg), [annualSalary, dependents, cfg])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">연봉 실수령액 계산기</h2>
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
          <span>4대보험 요율 ({cfg.year}년)</span>
          <span className="text-gray-400">{showRates ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        {showRates && (
          <div className="px-5 pb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-gray-400">항목</th>
                  <th className="text-right py-1.5 text-gray-400">전체</th>
                  <th className="text-right py-1.5 text-gray-400">근로자</th>
                  <th className="text-right py-1.5 text-gray-400">사업주</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-1.5">국민연금</td>
                  <td className="text-right font-medium">{(cfg.nationalPension * 2 * 100).toFixed(1)}%</td>
                  <td className="text-right text-blue-600 font-medium">{(cfg.nationalPension * 100).toFixed(2)}%</td>
                  <td className="text-right">{(cfg.nationalPension * 100).toFixed(2)}%</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-1.5">건강보험</td>
                  <td className="text-right font-medium">{(cfg.healthInsurance * 2 * 100).toFixed(2)}%</td>
                  <td className="text-right text-blue-600 font-medium">{(cfg.healthInsurance * 100).toFixed(3)}%</td>
                  <td className="text-right">{(cfg.healthInsurance * 100).toFixed(3)}%</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-1.5">장기요양보험</td>
                  <td className="text-right font-medium" colSpan={3}>건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-1.5">고용보험</td>
                  <td className="text-right font-medium">{(cfg.employmentInsurance * 2 * 100).toFixed(1)}%</td>
                  <td className="text-right text-blue-600 font-medium">{(cfg.employmentInsurance * 100).toFixed(1)}%</td>
                  <td className="text-right">{(cfg.employmentInsurance * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-400">
              <p>• 국민연금 기준소득월액: {fmt(cfg.nationalPensionFloorMonthly)} ~ {fmt(cfg.nationalPensionCeilMonthly)}</p>
              <p>• 산재보험: 전액 사업주 부담 (근로자 공제 없음)</p>
            </div>
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연봉 (세전): <span className="text-blue-600 font-bold">{fmt(annualSalary)}</span>
            <span className="text-xs text-gray-400 ml-1">(월 {fmt(annualSalary / 12)})</span>
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {PRESETS.map((p) => (
              <button key={p.value} onClick={() => setAnnualSalary(p.value)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${annualSalary === p.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="range" min={20_000_000} max={300_000_000} step={1_000_000}
            value={annualSalary} onChange={(e) => setAnnualSalary(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            부양가족 수 (본인 포함): <span className="text-blue-600">{dependents}명</span>
          </label>
          <input type="range" min={1} max={7} step={1}
            value={dependents} onChange={(e) => setDependents(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
      </div>

      {/* 결과 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">월 실수령액</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{fmtWon(result.netMonthly)}</div>
            <div className="text-xs text-gray-400">공제율 {result.deductionRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="space-y-3">
          {/* 4대보험 */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">4대보험 (월 {fmtWon(result.totalInsurance)})</div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <div className="flex justify-between"><span>국민연금 ({(cfg.nationalPension * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmtWon(result.pension)}</span></div>
              <div className="flex justify-between"><span>건강보험 ({(cfg.healthInsurance * 100).toFixed(3)}%)</span><span className="text-red-500">-{fmtWon(result.health)}</span></div>
              <div className="flex justify-between"><span>장기요양 (건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmtWon(result.longTermCare)}</span></div>
              <div className="flex justify-between"><span>고용보험 ({(cfg.employmentInsurance * 100).toFixed(1)}%)</span><span className="text-red-500">-{fmtWon(result.employment)}</span></div>
            </div>
          </div>

          {/* 세금 */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">세금 (월 {fmtWon(result.totalTax)})</div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <div className="flex justify-between"><span>근로소득세</span><span className="text-red-500">-{fmtWon(result.incomeTax)}</span></div>
              <div className="flex justify-between"><span>지방소득세 ({(cfg.localIncomeTaxRate * 100).toFixed(0)}%)</span><span className="text-red-500">-{fmtWon(result.localTax)}</span></div>
            </div>
          </div>

          {/* 합계 */}
          <div className="border-t border-gray-100 pt-2">
            <div className="text-xs text-gray-500 space-y-0.5">
              <div className="flex justify-between"><span>월 급여 (세전)</span><span className="font-medium text-gray-700">{fmtWon(result.grossMonthly)}</span></div>
              <div className="flex justify-between"><span>총 공제</span><span className="text-red-500 font-medium">-{fmtWon(result.totalDeduction)}</span></div>
              <div className="flex justify-between font-medium text-gray-800 text-sm pt-1">
                <span>실수령액</span><span>{fmtWon(result.netMonthly)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 바 차트 */}
        <div className="mt-4 w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
          <div className="h-3 bg-blue-500" style={{ width: `${(result.netMonthly / result.grossMonthly) * 100}%` }} title="실수령" />
          <div className="h-3 bg-orange-400" style={{ width: `${(result.totalInsurance / result.grossMonthly) * 100}%` }} title="4대보험" />
          <div className="h-3 bg-red-400" style={{ width: `${(result.totalTax / result.grossMonthly) * 100}%` }} title="세금" />
        </div>
        <div className="flex gap-4 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />실수령 {((result.netMonthly / result.grossMonthly) * 100).toFixed(0)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />4대보험 {((result.totalInsurance / result.grossMonthly) * 100).toFixed(0)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />세금 {((result.totalTax / result.grossMonthly) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 연봉대별 비교표 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">연봉대별 실수령액</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-gray-500 font-medium">연봉</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">월 실수령</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">공제율</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">연 실수령</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((p) => {
                const r = calculate(p.value, dependents, cfg)
                return (
                  <tr key={p.value} className={`border-b border-gray-50 ${annualSalary === p.value ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 px-1 font-medium text-gray-600">{p.label}</td>
                    <td className="text-right py-2 px-1 text-gray-700 font-medium">{fmtWon(r.netMonthly)}</td>
                    <td className="text-right py-2 px-1 text-red-500">{r.deductionRate.toFixed(1)}%</td>
                    <td className="text-right py-2 px-1 text-gray-700">{fmt(r.netAnnual)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">* 부양가족 {dependents}명 기준 / {cfg.year}년 요율 적용</p>
      </div>

      {/* 참고 */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">참고</p>
        <p>• 간이세액표 근사치로 계산 (실제 급여명세서와 차이 있을 수 있음)</p>
        <p>• 비과세 수당 (식대 20만, 차량유지비 등) 미반영</p>
        <p>• 연말정산 시 추가 공제/환급 발생 가능</p>
        <p>• 성과급, 상여금 별도 시 세율 차이 발생</p>
      </div>
    </div>
  )
}
