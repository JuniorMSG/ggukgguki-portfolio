import { useState, useMemo } from 'react'

// ══════════════════════════════════════════════
// 연도별 세율 설정
// ══════════════════════════════════════════════

interface TaxBracket {
  limit: number
  rate: number        // 기본세율 (지방소득세 미포함)
  deduction: number
}

interface YearlyTaxConfig {
  year: number
  label: string

  // 종합소득세
  incomeTaxBrackets: TaxBracket[]
  localIncomeTaxRate: number          // 지방소득세율 (소득세의 %)

  // 배당소득세
  dividendWithholding: number         // 국내 원천징수율 (지방세 포함)
  dividendWithholdingUS: number       // 미국 원천징수율
  financialIncomeThreshold: number    // 금융소득종합과세 기준

  // 양도소득세 (해외주식)
  capitalGainsRate: number            // 양도세율 (지방세 포함)
  capitalGainsDeduction: number       // 기본공제

  // ISA
  isaTaxFreeLimit: number
  isaExcessRate: number

  // 연금저축/IRP
  pensionRate55_69: number
  pensionRate70_79: number
  pensionRate80Plus: number
  pensionLumpSum: number              // 일시수령/초과 분리과세
  pensionCreditLimit: number          // 세액공제 납입 한도
  pensionCreditRateLow: number        // 총급여 5,500만 이하
  pensionCreditRateHigh: number       // 총급여 5,500만 초과
  pensionAnnualReceiveLimit: number   // 연금 수령 분리과세 기준

  // 건강보험
  healthInsuranceRate: number         // 건보료율
  longTermCareRate: number            // 장기요양보험료율 (건보료의 %)
  dependentIncomeLimit: number        // 피부양자 탈락 소득 기준

  // 비고
  notes: string[]
}

const TAX_CONFIGS: Record<number, YearlyTaxConfig> = {
  2025: {
    year: 2025,
    label: '2025년',
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
    dividendWithholding: 0.154,
    dividendWithholdingUS: 0.15,
    financialIncomeThreshold: 20_000_000,
    capitalGainsRate: 0.22,
    capitalGainsDeduction: 2_500_000,
    isaTaxFreeLimit: 2_000_000,
    isaExcessRate: 0.099,
    pensionRate55_69: 0.033,
    pensionRate70_79: 0.044,
    pensionRate80Plus: 0.055,
    pensionLumpSum: 0.165,
    pensionCreditLimit: 9_000_000,
    pensionCreditRateLow: 0.165,
    pensionCreditRateHigh: 0.132,
    pensionAnnualReceiveLimit: 12_000_000,
    healthInsuranceRate: 0.0709,
    longTermCareRate: 0.1295,
    dependentIncomeLimit: 20_000_000,
    notes: [
      '건보료율 7.09%',
      '장기요양보험료 = 건보료의 12.95%',
    ],
  },
  2026: {
    year: 2026,
    label: '2026년',
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
    dividendWithholding: 0.154,
    dividendWithholdingUS: 0.15,
    financialIncomeThreshold: 20_000_000,
    capitalGainsRate: 0.22,
    capitalGainsDeduction: 2_500_000,
    isaTaxFreeLimit: 2_000_000,
    isaExcessRate: 0.099,
    pensionRate55_69: 0.033,
    pensionRate70_79: 0.044,
    pensionRate80Plus: 0.055,
    pensionLumpSum: 0.165,
    pensionCreditLimit: 9_000_000,
    pensionCreditRateLow: 0.165,
    pensionCreditRateHigh: 0.132,
    pensionAnnualReceiveLimit: 12_000_000,
    healthInsuranceRate: 0.0719,
    longTermCareRate: 0.1314,
    dependentIncomeLimit: 20_000_000,
    notes: [
      '건보료율 7.09% → 7.19% (+0.1%p)',
      '장기요양보험료 = 건보료의 12.95% → 13.14%',
      '배당소득 분리과세 신설 (국내 상장 대상기업 한정, 2026~2028 한시, 해외주식 미적용)',
    ],
  },
}

const AVAILABLE_YEARS = Object.keys(TAX_CONFIGS).map(Number).sort((a, b) => b - a)

// ══════════════════════════════════════════════
// 계산 함수
// ══════════════════════════════════════════════

function calcIncomeTax(taxableIncome: number, cfg: YearlyTaxConfig): number {
  if (taxableIncome <= 0) return 0
  for (const bracket of cfg.incomeTaxBrackets) {
    if (taxableIncome <= bracket.limit) {
      const tax = taxableIncome * bracket.rate - bracket.deduction
      return Math.max(tax, 0) * (1 + cfg.localIncomeTaxRate)
    }
  }
  return 0
}

interface InsuranceDetail {
  health: number
  longTermCare: number
  total: number
}

function calcInsurance(financialIncome: number, cfg: YearlyTaxConfig): InsuranceDetail {
  if (financialIncome <= cfg.dependentIncomeLimit) {
    return { health: 0, longTermCare: 0, total: 0 }
  }
  const excess = financialIncome - cfg.dependentIncomeLimit
  const health = excess * cfg.healthInsuranceRate
  const longTermCare = health * cfg.longTermCareRate
  return { health, longTermCare, total: health + longTermCare }
}

function calcDividendTax(
  dividendIncome: number,
  otherIncome: number,
  cfg: YearlyTaxConfig,
): { tax: number; withheld: number; additional: number; isComprehensive: boolean } {
  const withheld = dividendIncome * cfg.dividendWithholding

  if (dividendIncome <= cfg.financialIncomeThreshold) {
    return { tax: withheld, withheld, additional: 0, isComprehensive: false }
  }

  const taxWith = calcIncomeTax(otherIncome + dividendIncome, cfg)
  const taxWithout = calcIncomeTax(otherIncome, cfg)
  const comprehensiveTax = taxWith - taxWithout
  const additional = Math.max(comprehensiveTax - withheld, 0)

  return { tax: withheld + additional, withheld, additional, isComprehensive: true }
}

// ══════════════════════════════════════════════
// 시뮬레이션
// ══════════════════════════════════════════════

interface SimResult {
  label: string
  grossReturn: number
  dividendTax: number
  capitalTax: number
  insurance: InsuranceDetail
  taxCredit: number
  netReturn: number
  effectiveRate: number
  totalDeduction: number
  note: string
}

function simulate(
  totalAsset: number,
  annualReturn: number,
  dividendYield: number,
  otherIncome: number,
  cfg: YearlyTaxConfig,
): SimResult[] {
  const capitalGain = totalAsset * (annualReturn - dividendYield) / 100
  const dividendIncome = totalAsset * dividendYield / 100
  const grossReturn = capitalGain + dividendIncome
  const results: SimResult[] = []
  const noIns: InsuranceDetail = { health: 0, longTermCare: 0, total: 0 }

  // 1. 일반 해외계좌
  {
    const taxableGain = Math.max(capitalGain - cfg.capitalGainsDeduction, 0)
    const capTax = taxableGain * cfg.capitalGainsRate
    const div = calcDividendTax(dividendIncome, otherIncome, cfg)
    const ins = calcInsurance(dividendIncome, cfg)
    const totalDeduction = capTax + div.tax + ins.total
    const net = grossReturn - totalDeduction

    let note = ''
    if (!div.isComprehensive) {
      note = `배당 ≤ ${fmt(cfg.financialIncomeThreshold)} → 원천징수 ${(cfg.dividendWithholding * 100).toFixed(1)}% 분리과세`
    } else {
      const parts = [`종합과세 (기납부 ${fmt(div.withheld)} 공제, 추가 ${fmt(div.additional)})`]
      if (ins.total > 0) parts.push(`건보 ${fmt(ins.health)} + 장기요양 ${fmt(ins.longTermCare)}`)
      note = `배당 ${fmt(dividendIncome)} > ${fmt(cfg.financialIncomeThreshold)} → ${parts.join(' + ')}`
    }

    results.push({ label: '일반 해외계좌', grossReturn, dividendTax: div.tax, capitalTax: capTax, insurance: ins, taxCredit: 0, netReturn: net, totalDeduction, effectiveRate: grossReturn > 0 ? (totalDeduction / grossReturn) * 100 : 0, note })
  }

  // 2. ISA
  {
    const taxable = Math.max(grossReturn - cfg.isaTaxFreeLimit, 0)
    const tax = taxable * cfg.isaExcessRate
    const net = grossReturn - tax
    results.push({ label: 'ISA', grossReturn, dividendTax: tax, capitalTax: 0, insurance: noIns, taxCredit: 0, netReturn: net, totalDeduction: tax, effectiveRate: grossReturn > 0 ? (tax / grossReturn) * 100 : 0, note: `${fmt(cfg.isaTaxFreeLimit)} 비과세 + 초과분 ${(cfg.isaExcessRate * 100).toFixed(1)}% | 건보·장기요양 없음` })
  }

  // 3. 연금저축 (≤1,200만/년)
  {
    const pensionTax = grossReturn * cfg.pensionRate55_69
    const creditableAmount = Math.min(totalAsset, cfg.pensionCreditLimit)
    const creditRate = otherIncome <= 55_000_000 ? cfg.pensionCreditRateLow : cfg.pensionCreditRateHigh
    const taxCredit = creditableAmount * creditRate
    const totalDeduction = pensionTax - taxCredit
    const net = grossReturn - pensionTax + taxCredit
    results.push({ label: '연금저축 (≤1,200만/년)', grossReturn, dividendTax: pensionTax, capitalTax: 0, insurance: noIns, taxCredit, netReturn: net, totalDeduction: Math.max(totalDeduction, 0), effectiveRate: grossReturn > 0 ? (Math.max(totalDeduction, 0) / grossReturn) * 100 : 0, note: `과세이연 → 수령 시 ${(cfg.pensionRate55_69 * 100).toFixed(1)}% | 세액공제 ${fmt(taxCredit)} | 건보료 없음` })
  }

  // 4. 연금저축 (>1,200만/년)
  {
    const separateTax = grossReturn * cfg.pensionLumpSum
    const comprehensiveTax = calcIncomeTax(otherIncome + grossReturn, cfg) - calcIncomeTax(otherIncome, cfg)
    const ins = calcInsurance(grossReturn, cfg)
    const creditableAmount = Math.min(totalAsset, cfg.pensionCreditLimit)
    const creditRate = otherIncome <= 55_000_000 ? cfg.pensionCreditRateLow : cfg.pensionCreditRateHigh
    const taxCredit = creditableAmount * creditRate
    const separateTotal = separateTax - taxCredit
    const comprehensiveTotal = comprehensiveTax + ins.total - taxCredit
    const isSeparateBetter = separateTotal <= comprehensiveTotal
    const tax = isSeparateBetter ? separateTax : comprehensiveTax
    const appliedIns = isSeparateBetter ? noIns : ins
    const totalDeduction = tax + appliedIns.total - taxCredit
    const net = grossReturn - tax - appliedIns.total + taxCredit
    results.push({ label: '연금저축 (>1,200만/년)', grossReturn, dividendTax: tax, capitalTax: 0, insurance: appliedIns, taxCredit, netReturn: net, totalDeduction: Math.max(totalDeduction, 0), effectiveRate: grossReturn > 0 ? (Math.max(totalDeduction, 0) / grossReturn) * 100 : 0, note: isSeparateBetter ? `${(cfg.pensionLumpSum * 100).toFixed(1)}% 분리과세 | 세액공제 ${fmt(taxCredit)} | 건보료 없음` : `종합과세 선택 | 세액공제 ${fmt(taxCredit)} | 건보+장기요양 ${fmt(appliedIns.total)}` })
  }

  return results.sort((a, b) => b.netReturn - a.netReturn)
}

// ══════════════════════════════════════════════
// 유틸
// ══════════════════════════════════════════════

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`
  return n.toLocaleString() + '원'
}

function fmtWon(n: number): string {
  return Math.round(n).toLocaleString() + '원'
}

function fmtLimit(n: number): string {
  if (n === Infinity) return '초과'
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억`
  return `${(n / 10_000).toLocaleString()}만`
}

function getStrategy(dividendIncome: number, totalAsset: number): string {
  if (dividendIncome <= 20_000_000) {
    if (totalAsset <= 100_000_000) return '세액공제 극대화: 연금저축 600만 + IRP 300만 → ISA 2,000만 → 나머지 일반계좌'
    return '배당 2,000만 이하 유지: 일반계좌 배당 분리과세 + 연금저축 과세이연 활용'
  }
  if (dividendIncome <= 50_000_000) return '배당 2,000만 초과: 고배당 종목은 연금저축/ISA로, 일반계좌는 성장주 위주 (건보+장기요양 방어)'
  return '대형 포트폴리오: 연금 수령 ≤1,200만/년 + ISA 활용 + 일반계좌 배당 최소화'
}

const PRESETS = [
  { label: '5천만', value: 50_000_000 },
  { label: '1억', value: 100_000_000 },
  { label: '3억', value: 300_000_000 },
  { label: '5억', value: 500_000_000 },
  { label: '10억', value: 1_000_000_000 },
  { label: '30억', value: 3_000_000_000 },
  { label: '50억', value: 5_000_000_000 },
]

// ══════════════════════════════════════════════
// 컴포넌트
// ══════════════════════════════════════════════

export default function TaxSimPage() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const [totalAsset, setTotalAsset] = useState(300_000_000)
  const [annualReturn, setAnnualReturn] = useState(8)
  const [dividendYield, setDividendYield] = useState(3)
  const [otherIncome, setOtherIncome] = useState(50_000_000)
  const [showRates, setShowRates] = useState(false)

  const cfg = TAX_CONFIGS[selectedYear]

  const results = useMemo(
    () => simulate(totalAsset, annualReturn, dividendYield, otherIncome, cfg),
    [totalAsset, annualReturn, dividendYield, otherIncome, cfg],
  )

  const dividendIncome = totalAsset * dividendYield / 100
  const strategy = getStrategy(dividendIncome, totalAsset)
  const best = results[0]
  const worst = results[results.length - 1]
  const diff = best && worst ? best.netReturn - worst.netReturn : 0
  const insurance = calcInsurance(dividendIncome, cfg)

  return (
    <div className="space-y-6">
      {/* 헤더 + 연도 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">세금 시뮬레이터</h2>
        <div className="flex items-center gap-2">
          {AVAILABLE_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === y
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {y}년
            </button>
          ))}
        </div>
      </div>

      {/* 연도 변경사항 */}
      {cfg.notes.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="text-xs font-medium text-amber-700 mb-1">{cfg.label} 변경사항</div>
          {cfg.notes.map((note, i) => (
            <div key={i} className="text-xs text-amber-600">• {note}</div>
          ))}
        </div>
      )}

      {/* 적용 세율 기준 (토글) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowRates(!showRates)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>적용 세율 기준 ({cfg.label})</span>
          <span className="text-gray-400">{showRates ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>

        {showRates && (
          <div className="px-5 pb-4 space-y-4">
            {/* 종합소득세 구간 */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">종합소득세율 (지방소득세 {(cfg.localIncomeTaxRate * 100).toFixed(0)}% 별도)</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 text-gray-400 font-medium">과세표준</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium">세율</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium">지방세 포함</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium">누진공제</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.incomeTaxBrackets.map((b, i) => {
                    const prev = i === 0 ? 0 : cfg.incomeTaxBrackets[i - 1].limit
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-600">
                          {fmtLimit(prev)} ~ {b.limit === Infinity ? '' : fmtLimit(b.limit)}
                          {b.limit === Infinity && '~'}
                        </td>
                        <td className="text-right py-1.5 text-gray-700 font-medium">{(b.rate * 100).toFixed(0)}%</td>
                        <td className="text-right py-1.5 text-blue-600 font-medium">{(b.rate * (1 + cfg.localIncomeTaxRate) * 100).toFixed(1)}%</td>
                        <td className="text-right py-1.5 text-gray-500">{b.deduction > 0 ? fmt(b.deduction) : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 기타 세율 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">투자소득 과세</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>배당 원천징수</span><span className="font-medium">{(cfg.dividendWithholding * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>종합과세 기준</span><span className="font-medium">{fmt(cfg.financialIncomeThreshold)}</span></div>
                  <div className="flex justify-between"><span>해외주식 양도세</span><span className="font-medium">{(cfg.capitalGainsRate * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between"><span>양도세 공제</span><span className="font-medium">{fmt(cfg.capitalGainsDeduction)}/년</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">사회보험료</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>건강보험료율</span><span className="font-medium">{(cfg.healthInsuranceRate * 100).toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span>장기요양보험료</span><span className="font-medium">건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span>피부양자 탈락</span><span className="font-medium">소득 &gt; {fmt(cfg.dependentIncomeLimit)}</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">ISA</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>비과세 한도</span><span className="font-medium">{fmt(cfg.isaTaxFreeLimit)}</span></div>
                  <div className="flex justify-between"><span>초과분 세율</span><span className="font-medium">{(cfg.isaExcessRate * 100).toFixed(1)}%</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">연금저축/IRP</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>세액공제 한도</span><span className="font-medium">{fmt(cfg.pensionCreditLimit)}</span></div>
                  <div className="flex justify-between"><span>공제율 (≤5,500만)</span><span className="font-medium">{(cfg.pensionCreditRateLow * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>공제율 (&gt;5,500만)</span><span className="font-medium">{(cfg.pensionCreditRateHigh * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>연금소득세 (55~69)</span><span className="font-medium">{(cfg.pensionRate55_69 * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>분리과세 (초과)</span><span className="font-medium">{(cfg.pensionLumpSum * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 입력 ── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            총 투자자산: <span className="text-blue-600 font-bold">{fmt(totalAsset)}</span>
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setTotalAsset(p.value)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  totalAsset === p.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input type="range" min={10_000_000} max={5_000_000_000} step={10_000_000} value={totalAsset} onChange={(e) => setTotalAsset(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연평균 수익률: <span className="text-blue-600">{annualReturn}%</span>
            </label>
            <input type="range" min={0} max={30} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              배당수익률: <span className="text-blue-600">{dividendYield}%</span>
            </label>
            <input type="range" min={0} max={10} step={0.5} value={dividendYield} onChange={(e) => setDividendYield(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            근로소득 (총급여): <span className="text-blue-600">{fmt(otherIncome)}</span>
            <span className="text-xs text-gray-400 ml-1">(종합과세 합산 + 세액공제율 기준)</span>
          </label>
          <input type="range" min={0} max={200_000_000} step={5_000_000} value={otherIncome} onChange={(e) => setOtherIncome(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="grid grid-cols-3 gap-2">
            <div>매매차익: <span className="font-medium">{fmt(totalAsset * (annualReturn - dividendYield) / 100)}</span>/년</div>
            <div>배당: <span className="font-medium">{fmt(dividendIncome)}</span>/년</div>
            <div>총수익: <span className="font-medium">{fmt(totalAsset * annualReturn / 100)}</span>/년</div>
          </div>
        </div>
      </div>

      {/* ── 전략 추천 ── */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="text-sm font-medium text-blue-800 mb-1">추천 전략</div>
        <div className="text-sm text-blue-700">{strategy}</div>
        {diff > 0 && (
          <div className="text-xs text-blue-500 mt-1">
            최적 vs 최악 차이: <span className="font-bold">{fmtWon(diff)}</span>/년
          </div>
        )}
      </div>

      {/* ── 종합과세 경고 ── */}
      {dividendIncome > cfg.financialIncomeThreshold && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="text-sm font-medium text-red-800 mb-1">금융소득종합과세 + 피부양자 탈락 구간</div>
          <div className="text-sm text-red-700 space-y-1">
            <p>배당 {fmt(dividendIncome)} &gt; {fmt(cfg.financialIncomeThreshold)} → 종합과세 대상</p>
            <p>건강보험료 {fmt(insurance.health)}/년 + 장기요양보험료 {fmt(insurance.longTermCare)}/년 = 합계 {fmt(insurance.total)}/년</p>
          </div>
        </div>
      )}

      {/* ── 결과 카드 ── */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={r.label} className={`bg-white rounded-xl p-4 shadow-sm border ${i === 0 ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">최적</span>}
                <span className="font-semibold text-gray-800">{r.label}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">{fmtWon(r.netReturn)}</div>
                <div className="text-xs text-gray-400">실효세율 {r.effectiveRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-0.5 mb-2">
              <div className="flex justify-between"><span>총수익</span><span className="font-medium">{fmt(r.grossReturn)}</span></div>
              {r.dividendTax > 0 && <div className="flex justify-between"><span>배당/소득세</span><span className="text-red-500">-{fmt(r.dividendTax)}</span></div>}
              {r.capitalTax > 0 && <div className="flex justify-between"><span>양도소득세</span><span className="text-red-500">-{fmt(r.capitalTax)}</span></div>}
              {r.insurance.health > 0 && <div className="flex justify-between"><span>건강보험료 ({(cfg.healthInsuranceRate * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmt(r.insurance.health)}</span></div>}
              {r.insurance.longTermCare > 0 && <div className="flex justify-between"><span>장기요양보험료 (건보의 {(cfg.longTermCareRate * 100).toFixed(2)}%)</span><span className="text-red-500">-{fmt(r.insurance.longTermCare)}</span></div>}
              {r.taxCredit > 0 && <div className="flex justify-between"><span>세액공제 환급</span><span className="text-green-600">+{fmt(r.taxCredit)}</span></div>}
              <div className="flex justify-between border-t border-gray-100 pt-1 font-medium text-gray-700"><span>세후 수익</span><span>{fmtWon(r.netReturn)}</span></div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${r.grossReturn > 0 ? Math.max((r.netReturn / r.grossReturn) * 100, 0) : 0}%`, backgroundColor: i === 0 ? '#10b981' : i === results.length - 1 ? '#ef4444' : '#3b82f6' }} />
            </div>
            <div className="text-xs text-gray-400">{r.note}</div>
          </div>
        ))}
      </div>

      {/* ── 금액대별 비교표 ── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">금액대별 실효세율 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-gray-500 font-medium">자산</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">일반</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">ISA</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">연금(≤1200)</th>
                <th className="text-right py-2 px-1 text-gray-500 font-medium">연금(&gt;1200)</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((p) => {
                const r = simulate(p.value, annualReturn, dividendYield, otherIncome, cfg)
                const find = (label: string) => r.find((x) => x.label === label)
                const rates = [
                  find('일반 해외계좌')?.effectiveRate ?? 100,
                  find('ISA')?.effectiveRate ?? 100,
                  find('연금저축 (≤1,200만/년)')?.effectiveRate ?? 100,
                  find('연금저축 (>1,200만/년)')?.effectiveRate ?? 100,
                ]
                const minRate = Math.min(...rates)
                return (
                  <tr key={p.value} className={`border-b border-gray-50 ${totalAsset === p.value ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 px-1 font-medium text-gray-600">{p.label}</td>
                    {rates.map((rate, j) => <td key={j} className={`text-right py-2 px-1 ${Math.abs(rate - minRate) < 0.01 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{rate.toFixed(1)}%</td>)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * {cfg.label} 기준 / 수익률 {annualReturn}%, 배당률 {dividendYield}%, 근로소득 {fmt(otherIncome)}
          / 초록색 = 해당 금액대 최적
        </p>
      </div>

      {/* 주의사항 */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">참고</p>
        <p>• 연금저축/IRP는 ETF·펀드만 가능 (개별주식 불가)</p>
        <p>• 건보료는 피부양자 탈락 → 지역가입자 전환 시 초과 금융소득에 부과</p>
        <p>• 피부양자 탈락 후 4년간 한시 경감 (2→3→4년차: 60→40→20%) - 시뮬레이션에 미반영</p>
        <p>• 2026년 배당소득 분리과세 (국내 상장 대상기업 한정, 해외주식 미적용) - 시뮬레이션에 미반영</p>
        <p>• 실제 세금은 소득공제, 세액감면 등에 따라 달라질 수 있음</p>
      </div>
    </div>
  )
}
