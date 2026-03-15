-- 꾹꾹이 초기 스키마
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
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

-- 자산군 (계층형: 대분류/소분류)
CREATE TABLE asset_class (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT DEFAULT NULL COMMENT '상위 자산군 (NULL=대분류)',
    name VARCHAR(50) NOT NULL COMMENT '자산군명',
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES asset_class(id)
) COMMENT '자산군 마스터';

-- 유저별 자산 비중 설정
CREATE TABLE user_asset_allocation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_class_id BIGINT NOT NULL,
    target_ratio DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '목표 비중 (%)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (asset_class_id) REFERENCES asset_class(id),
    UNIQUE KEY uk_user_asset (user_id, asset_class_id)
) COMMENT '유저별 자산 배분';

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

-- 수입/지출 카테고리 (계층형)
CREATE TABLE cashflow_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT DEFAULT NULL COMMENT '상위 카테고리 (NULL=대분류)',
    name VARCHAR(50) NOT NULL COMMENT '카테고리명',
    flow_type VARCHAR(10) NOT NULL COMMENT 'INCOME / EXPENSE',
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES cashflow_category(id)
) COMMENT '수입/지출 카테고리';

-- 수입/지출 기록
CREATE TABLE cashflow_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount BIGINT NOT NULL COMMENT '금액 (원)',
    record_date DATE NOT NULL COMMENT '기록일',
    memo VARCHAR(200) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES cashflow_category(id)
) COMMENT '수입/지출 기록';

-- ========================================
-- 초기 데이터
-- ========================================

-- 유저
INSERT INTO users (email, nickname) VALUES ('user@example.com', 'MSG');

-- 계좌 (5:4:0:1 전략, 주 100만원)
INSERT INTO account (user_id, name, account_type, annual_limit) VALUES
(1, '연금저축1', 'PENSION_SAVINGS', 6000000),
(1, '연금저축2', 'PENSION_SAVINGS', 9000000),
(1, 'IRP',      'IRP',             3000000),
(1, 'ISA',      'ISA',             20000000),
(1, '해외계좌',  'OVERSEAS',        NULL);

-- 자산군 마스터 (대분류)
INSERT INTO asset_class (id, parent_id, name, display_order) VALUES
(1, NULL, '주식',   1),
(2, NULL, '채권',   2),
(3, NULL, '원자재', 3),
(4, NULL, '현금',   4);

-- 자산군 마스터 (소분류)
INSERT INTO asset_class (id, parent_id, name, display_order) VALUES
(11, 1, '성장주',    1),
(12, 1, '배당성장주', 2),
(13, 1, '배당주',    3),
(14, 1, '리츠',     4),
(21, 2, '국채',     1),
(22, 2, '회사채',    2),
(31, 3, '금',       1),
(32, 3, '은',       2),
(41, 4, '예금',     1),
(42, 4, 'MMF',     2);

-- MSG 자산 배분 (5:4:0:1 전략)
INSERT INTO user_asset_allocation (user_id, asset_class_id, target_ratio) VALUES
(1, 11, 50.00),
(1, 12, 40.00),
(1,  4, 10.00);

-- 수입 카테고리
INSERT INTO cashflow_category (id, parent_id, name, flow_type, display_order) VALUES
(100, NULL, '수입', 'INCOME', 1),
(101, 100, '급여',     'INCOME', 1),
(102, 100, '부수입',    'INCOME', 2),
(103, 100, '상여금',    'INCOME', 3);

-- 지출 카테고리
INSERT INTO cashflow_category (id, parent_id, name, flow_type, display_order) VALUES
(200, NULL, '고정비', 'EXPENSE', 1),
(201, 200, '보험',    'EXPENSE', 1),
(202, 200, '구독료',  'EXPENSE', 2),
(203, 200, '통신비',  'EXPENSE', 3),
(204, 200, '교통비',  'EXPENSE', 4),
(205, 200, '주거비',  'EXPENSE', 5),
(300, NULL, '생활비', 'EXPENSE', 2),
(301, 300, '식비',    'EXPENSE', 1),
(302, 300, '쇼핑',    'EXPENSE', 2),
(303, 300, '여가',    'EXPENSE', 3),
(400, NULL, '비상금', 'EXPENSE', 3),
(401, 400, '의료비',  'EXPENSE', 1),
(402, 400, '경조사',  'EXPENSE', 2);
