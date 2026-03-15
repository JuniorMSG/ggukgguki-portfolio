# 주간 스냅샷 도메인

## 개요

매주 포트폴리오 현황을 기록하는 주간 스냅샷. 자산 추이를 추적하는 핵심 데이터.

## 기초 데이터 (저장)

| 필드 | 설명 |
|------|------|
| week_label | 주차 라벨 (24-01 주차) |
| start_date / end_date | 주간 시작일~종료일 |
| total_capital | 자본 총액 |
| total_investment | 투자 자산 총액 (유동현금 포함) |
| invested_plus_cash | 투자원금 + 현금 |
| total_dividend | 배당 누적 총액 |
| acct_* | 계좌별 평가금액 (overseas, domestic, irp, pension1, pension2, isa, cash) |
| weekly_change | 주간 순증가량 |
| weekly_dividend | 주간 배당금 |
| asset_* | 자산군별 금액 (growth, dividend, bond, cash, domestic) |
| exchange_rate | USD/KRW 환율 |

## 계산 데이터 (조회 시 도출)

| 항목 | 계산식 |
|------|--------|
| 자본 성장률 | 이번주 totalCapital / 지난주 totalCapital × 100 |
| 투자자산 성장률 | 이번주 totalInvestment / 지난주 totalInvestment × 100 |
| 수익률 | (totalInvestment - investedPlusCash) / investedPlusCash × 100 |
| 순 투자자산 | totalInvestment - acctCash |
| 비유동현금 | totalCapital - totalInvestment |
| 자산군 비율 | 각 asset_* / (asset 합계) × 100 |
| 연도별 순증가액 | 해당 연도 모든 주의 weekly_change 합계 |

## 자산군 분류

| 자산군 | 필드 | 포함 종목 예시 |
|--------|------|---------------|
| 성장주 | asset_growth | VOO, QQQ, NVDA, AAPL, MSFT |
| 배당주 | asset_dividend | SCHD, O, KO, JNJ, CSCO |
| 채권 | asset_bond | TLT, TMF, ACE 미국30년 국채 |
| 현금 | asset_cash | 유동현금 (CMA, 발행어음 등) |
| 국장 | asset_domestic | 삼성전자, 네이버 등 국내주식 |
