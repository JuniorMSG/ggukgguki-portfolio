-- 꾹꾹이 초기 스키마
CREATE DATABASE IF NOT EXISTS ggukgguki DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ggukgguki;

-- 유저
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일',
    nickname VARCHAR(50) NOT NULL COMMENT '닉네임',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '유저';

-- 계좌
CREATE TABLE account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL COMMENT '계좌명 (연금저축1, IRP, ISA 등)',
    account_type VARCHAR(30) NOT NULL COMMENT '계좌 유형 (PENSION_SAVINGS, IRP, ISA, OVERSEAS)',
    annual_limit BIGINT DEFAULT NULL COMMENT '연간 납입 한도 (원)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT '계좌';

-- 자산군
CREATE TABLE asset_class (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '자산군명 (성장, 배당, 채권, 현금)',
    target_ratio DECIMAL(5,2) DEFAULT NULL COMMENT '목표 비중 (%)',
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '자산군';

-- 종목
CREATE TABLE holding (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    asset_class_id BIGINT NOT NULL,
    ticker VARCHAR(20) NOT NULL COMMENT '종목 티커 (NVDA, SCHD 등)',
    name VARCHAR(100) NOT NULL COMMENT '종목명',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD' COMMENT '통화',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (asset_class_id) REFERENCES asset_class(id)
) COMMENT '보유 종목';

-- 매수/매도 기록
CREATE TABLE transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    holding_id BIGINT NOT NULL,
    type VARCHAR(10) NOT NULL COMMENT 'BUY / SELL',
    quantity DECIMAL(15,6) NOT NULL COMMENT '수량',
    price DECIMAL(15,4) NOT NULL COMMENT '단가',
    total_amount DECIMAL(15,2) NOT NULL COMMENT '총액',
    transaction_date DATE NOT NULL COMMENT '거래일',
    memo VARCHAR(200) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (holding_id) REFERENCES holding(id)
) COMMENT '매수/매도 기록';

-- 주간 스냅샷
CREATE TABLE weekly_snapshot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_date DATE NOT NULL COMMENT '스냅샷 기준일 (일요일)',
    exchange_rate DECIMAL(10,2) NOT NULL COMMENT 'USD/KRW 환율',
    total_krw BIGINT NOT NULL COMMENT '총 자산 (원화 환산)',
    memo VARCHAR(500) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_snapshot_date (snapshot_date)
) COMMENT '주간 스냅샷';

-- 스냅샷 상세 (종목별)
CREATE TABLE snapshot_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_id BIGINT NOT NULL,
    holding_id BIGINT NOT NULL,
    quantity DECIMAL(15,6) NOT NULL COMMENT '보유 수량',
    price DECIMAL(15,4) NOT NULL COMMENT '현재가',
    avg_price DECIMAL(15,4) NOT NULL COMMENT '평단가',
    evaluated_amount DECIMAL(15,2) NOT NULL COMMENT '평가액',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snapshot_id) REFERENCES weekly_snapshot(id),
    FOREIGN KEY (holding_id) REFERENCES holding(id)
) COMMENT '스냅샷 상세';

-- DCA 기록
CREATE TABLE dca_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    amount BIGINT NOT NULL COMMENT '투자 금액 (원)',
    record_date DATE NOT NULL COMMENT '투자일',
    memo VARCHAR(200) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id)
) COMMENT 'DCA 매수 기록';

-- 배당금/이자 기록
CREATE TABLE passive_income (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    holding_id BIGINT DEFAULT NULL,
    income_type VARCHAR(20) NOT NULL COMMENT 'DIVIDEND / INTEREST / OTHER',
    amount DECIMAL(15,4) NOT NULL COMMENT '금액',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    income_date DATE NOT NULL COMMENT '수령일',
    is_predicted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '예측 vs 실제',
    memo VARCHAR(200) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (holding_id) REFERENCES holding(id)
) COMMENT '배당금/이자 기록';
