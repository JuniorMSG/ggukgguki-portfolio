# 자산 관리 도메인

## 자산 구조

```
자본 총액 (totalCapital)
├── 투자 자산 (totalInvestment)
│   ├── 순 투자자산 (= totalInvestment - acctCash)
│   │   ├── 해외계좌 (acctOverseas) — USD 기반
│   │   ├── 국내계좌 (acctDomestic) — KRW
│   │   ├── IRP (acctIrp)
│   │   ├── 연금저축-1 (acctPension1)
│   │   ├── 연금저축-2 (acctPension2)
│   │   └── ISA (acctIsa)
│   └── 유동현금 (acctCash)
└── 비유동현금 (= totalCapital - totalInvestment)
```

## 용어 정의

| 용어 | 계산 | 설명 |
|------|------|------|
| **자본 총액** | 스냅샷 totalCapital | 모든 자산의 합계 |
| **투자 자산** | 스냅샷 totalInvestment | 주식 + 채권 + 유동현금 (비유동 제외) |
| **순 투자자산** | totalInvestment - acctCash | 주식 + 채권만 (현금 완전 제외) |
| **유동현금** | acctCash | 즉시 투자 가능한 현금 |
| **비유동현금** | totalCapital - totalInvestment | 당장 투자에 쓸 수 없는 현금 |
| **매수금액** | 수량 × 매수가 | 종목 매입에 사용한 금액 |
| **평가금액** | 수량 × 현재가 | 현재 시장가 기준 종목 가치 |

## 계좌 유형

| 유형 | 코드 | 연간 한도 | 세제 혜택 |
|------|------|----------|----------|
| 연금저축 | PENSION_SAVINGS | 연도별 설정 | 세액공제 (최대 연 900만) |
| IRP | IRP | 연도별 설정 | 세액공제 (연금저축과 합산 900만) |
| ISA | ISA | 연도별 설정 | 비과세 200만 + 분리과세 9.9% |
| 해외계좌 | OVERSEAS | 없음 | 양도세 250만 비과세 |
| 일반 | GENERAL | 없음 | 일반 과세 |

- 한도는 `account_annual_limit` 테이블에서 연도별 관리

## 현금성 자산

| 구분 | 코드 | 설명 |
|------|------|------|
| **비유동** | FIXED | 당장 투자에 쓸 수 없는 자산 (부모님 예치금, 청약 등) |
| **유동** | LIQUID | 즉시 인출/투자 가능한 자산 (CMA, 발행어음, 도약계좌 등) |

- 이자소득세: **15.4%** (소득세 14% + 지방소득세 1.4%)
- 세전이자 = 잔액 × 이율
- 세후이자 = 세전이자 × (1 - 0.154)

## 보유종목

| 필드 | 설명 |
|------|------|
| ticker | 종목 티커 (458730, NVDA 등) |
| name | 종목명 |
| currency | 통화 (KRW / USD) |
| quantity | 보유 수량 |
| avgPrice | 평균 매수가 |
| totalAmount | 매수금액 (= quantity × avgPrice) |
