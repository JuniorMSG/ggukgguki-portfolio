"""
꾹꾹이 Google Sheets → MySQL 마이그레이션 스크립트

시트 → DB 매핑:
  1. 운용시트 → holding (종목), account (계좌 보강)
  2. 투자계좌/저축계좌 입출금 → dca_record
  3. 배당내역 → passive_income
  4. 고정비 + 생활비 → cashflow_record (+ cashflow_category 보강)
"""

import re
import sys
from datetime import date, datetime

import gspread
import mysql.connector
from google.oauth2.service_account import Credentials

# ── 설정 ──────────────────────────────────────────────
SHEET_ID = '1N2w43ldLgDPOOgShQ7RtFJ6WzhW4d6_uHO2_SHydE2c'
SA_KEY = '/Users/musinsa/dev_personal/msg-ai-context/.claude/gentle-nuance-420916-301aed828102.json'
DB_CONFIG = dict(host='127.0.0.1', port=3307, user='ggukgguki', password='ggukgguki', database='ggukgguki')
USER_ID = 1  # MSG


def connect_sheets():
    creds = Credentials.from_service_account_file(SA_KEY, scopes=[
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
    ])
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID)


def connect_db():
    return mysql.connector.connect(**DB_CONFIG)


# ── 유틸리티 ──────────────────────────────────────────

def parse_krw(s: str) -> int | None:
    """'₩ 1,000,000' or '₩ (34,947)' → int"""
    if not s or not s.strip():
        return None
    s = s.strip().replace('₩', '').replace(',', '').strip()
    # 음수: (34,947)
    neg = False
    if s.startswith('(') and s.endswith(')'):
        neg = True
        s = s[1:-1].strip()
    if s.startswith('-'):
        neg = True
        s = s[1:].strip()
    if not s or s == '-' or s == '':
        return 0
    try:
        val = int(float(s))
        return -val if neg else val
    except ValueError:
        return None


def parse_usd(s: str) -> float | None:
    """'$148.35' → float"""
    if not s or not s.strip():
        return None
    s = s.strip().replace('$', '').replace(',', '').strip()
    neg = False
    if s.startswith('(') and s.endswith(')'):
        neg = True
        s = s[1:-1].strip()
    if s.startswith('-'):
        neg = True
        s = s[1:].strip()
    try:
        val = float(s)
        return -val if neg else val
    except ValueError:
        return None


def parse_date(s: str) -> date | None:
    """여러 형식 대응: '2024/01/02', '2024. 1. 1' 등"""
    if not s or not s.strip():
        return None
    s = s.strip()
    for fmt in ('%Y/%m/%d', '%Y. %m. %d', '%Y-%m-%d', '%Y.%m.%d'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    # '2024. 1. 1' 같은 형태
    m = re.match(r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})', s)
    if m:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def parse_quantity(s: str) -> float | None:
    """'25주', '1,323주', '99주' → float"""
    if not s or not s.strip():
        return None
    s = s.strip().replace('주', '').replace(',', '').strip()
    try:
        return float(s)
    except ValueError:
        return None


# ── 계좌 매핑 (ID 직접 매핑 — 인코딩 문제 우회) ─────
# 시트의 계좌 구분 → DB account.id
ACCOUNT_ID_MAP = {
    '일반-해외': 5,     # 해외계좌
    '일반-국내': 6,     # 국내계좌
    '연금저축-1': 1,    # 연금저축1
    '연금저축-2': 2,    # 연금저축2
    'IRP': 3,
    'ISA': 4,
    '저축': 7,          # 청년도약계좌
    '토스채권': 5,      # 해외계좌에 포함
}


def get_or_create_account(cur, name: str, account_type: str, annual_limit: int | None = None) -> int:
    cur.execute("SELECT id FROM account WHERE user_id = %s AND id = %s", (USER_ID, ACCOUNT_ID_MAP.get(name, -1)))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO account (user_id, name, account_type, annual_limit) VALUES (%s, %s, %s, %s)",
        (USER_ID, name, account_type, annual_limit)
    )
    return cur.lastrowid


def resolve_account_id(cur, sheet_account: str) -> int | None:
    """시트의 계좌 구분 → DB account_id"""
    return ACCOUNT_ID_MAP.get(sheet_account.strip())


# ── 자산군 매핑 (ID 직접 매핑) ────────────────────────
ASSET_CLASS_ID_MAP = {
    '미국 성장주': 11,   # 성장주
    '국내 성장주': 11,   # 성장주
    '미국 배당주': 13,   # 배당주
    '미국 채권': 21,     # 국채
    '현금': 41,          # 예금
}


def resolve_asset_class_id(cur, sheet_asset_class: str) -> int | None:
    return ASSET_CLASS_ID_MAP.get(sheet_asset_class.strip())


# ── 1. 보유종목 마이그레이션 (운용시트 → holding) ────
def migrate_holdings(sh, cur):
    print("\n=== 1. 보유종목 마이그레이션 ===")
    ws = sh.worksheet('운용시트')
    data = ws.get_all_values()

    count = 0
    for i, row in enumerate(data):
        if i < 5:  # 헤더 영역 스킵
            continue
        if len(row) < 12:
            continue

        # 종목명 + 티커 파싱: '애플 (AAPL)' or 'TIGER 미국배당다우존스 (458730)'
        # 종목은 row 중에서 괄호가 있는 셀 찾기
        ticker = None
        name = None
        account_str = None
        asset_class_str = None
        buy_price = None
        cur_price = None
        quantity = None
        currency = 'USD'

        # 운용시트 구조: [매수월, 자산구분, 통화, 자산군, 계좌구분, 종목명(티커), 매입가, 시가, 보유량, ...]
        # 하지만 열이 일정하지 않으므로 셀 내용으로 파싱

        cells = [c.strip() for c in row]

        for j, cell in enumerate(cells):
            # 종목명 (티커) 패턴
            m = re.match(r'^(.+?)\s*\(([A-Z0-9]+)\)$', cell)
            if m and len(m.group(2)) >= 2:
                name = m.group(1).strip()
                ticker = m.group(2)
                continue

            # 계좌 구분
            if cell in ACCOUNT_ID_MAP:
                account_str = cell
                continue

            # 자산군
            if cell in ASSET_CLASS_ID_MAP:
                asset_class_str = cell
                continue

        # 통화 판단
        if any('원화' in c for c in cells):
            currency = 'KRW'

        # 가격/수량 파싱 ($ or ₩ 시작하는 셀)
        price_cells = []
        for cell in cells:
            if cell.startswith('$') or (cell.startswith('₩') and '₩' in cell):
                price_cells.append(cell)

        # 수량
        for cell in cells:
            q = parse_quantity(cell)
            if q and q > 0:
                quantity = q
                break

        if not ticker or not account_str or not asset_class_str:
            continue

        # 현금은 holding이 아님
        if ticker in ('현금', '원', '달러') or name == '현금':
            continue

        account_id = resolve_account_id(cur, account_str)
        asset_class_id = resolve_asset_class_id(cur, asset_class_str)

        if not account_id or not asset_class_id:
            print(f"  ⚠️ 매핑 실패: account={account_str}, asset_class={asset_class_str}, ticker={ticker}")
            continue

        # 중복 체크
        cur.execute("SELECT id FROM holding WHERE account_id = %s AND ticker = %s", (account_id, ticker))
        if cur.fetchone():
            continue

        cur.execute(
            "INSERT INTO holding (account_id, asset_class_id, ticker, name, currency) VALUES (%s, %s, %s, %s, %s)",
            (account_id, asset_class_id, ticker, name, currency)
        )
        count += 1
        print(f"  ✅ {ticker} ({name}) → {account_str} [{currency}]")

    print(f"  총 {count}건 추가")
    return count


# ── 2. DCA 마이그레이션 (투자계좌/저축계좌 입출금 → dca_record) ──
def migrate_dca(sh, cur):
    print("\n=== 2. DCA 마이그레이션 ===")

    # 기존 데이터 삭제 (재실행 가능하도록)
    cur.execute("DELETE FROM dca_record WHERE account_id IN (SELECT id FROM account WHERE user_id = %s)", (USER_ID,))

    count = 0

    # 투자계좌 입출금
    ws = sh.worksheet('투자계좌 입출금')
    data = ws.get_all_values()

    for i, row in enumerate(data):
        if i < 2:  # 헤더
            continue
        if len(row) < 6:
            continue

        # Row: [0:연도, 1:거래일자, 2:거래일자(실제), 3:계좌, 4:빈칸, 5:금액, 6:주차]
        record_date = parse_date(row[2])
        if not record_date:
            continue

        account_str = row[3].strip()
        if not account_str or account_str not in ACCOUNT_ID_MAP:
            continue

        # 금액: col 5
        amount = parse_krw(row[5])
        if amount is None or amount == 0:
            continue

        account_id = resolve_account_id(cur, account_str)
        if not account_id:
            print(f"  ⚠️ 계좌 매핑 실패: {account_str}")
            continue

        memo = row[6].strip() if len(row) > 6 and row[6].strip() else None

        cur.execute(
            "INSERT INTO dca_record (account_id, amount, record_date, memo) VALUES (%s, %s, %s, %s)",
            (account_id, amount, record_date, memo)
        )
        count += 1

    # 저축계좌 입출금
    ws2 = sh.worksheet('저축계좌 입출금')
    data2 = ws2.get_all_values()

    for i, row in enumerate(data2):
        if i < 2:
            continue
        if len(row) < 6:
            continue

        record_date = parse_date(row[2])
        if not record_date:
            continue

        # 금액: col 5 (저축계좌)
        amount = parse_krw(row[5])
        if amount is None or amount == 0:
            continue

        account_id = resolve_account_id(cur, '저축')
        if not account_id:
            print(f"  ⚠️ 저축 계좌 매핑 실패")
            continue

        memo = row[4].strip() if len(row) > 4 and row[4].strip() else None

        cur.execute(
            "INSERT INTO dca_record (account_id, amount, record_date, memo) VALUES (%s, %s, %s, %s)",
            (account_id, amount, record_date, memo)
        )
        count += 1

    print(f"  총 {count}건 추가")
    return count


# ── 3. 배당금 마이그레이션 (배당내역 → passive_income) ──
def migrate_dividends(sh, cur):
    print("\n=== 3. 배당금 마이그레이션 ===")

    cur.execute("DELETE FROM passive_income")

    ws = sh.worksheet('배당내역')
    data = ws.get_all_values()

    count = 0
    skipped = 0

    for i, row in enumerate(data):
        if i < 1:  # 헤더
            continue
        if len(row) < 10:
            continue

        # [0:계좌구분, 1:일자, 2:연도, 3:월, 4:일, 5:주차, 6:종목코드, 7:종목명, 8:빈칸, 9:외화배당금($), 10:원화배당금(₩), 11:원화환산]
        account_str = row[0].strip()
        income_date = parse_date(row[1])
        ticker = row[6].strip() if len(row) > 6 else ''

        if not income_date or not ticker:
            continue

        # 달러 배당금: col 9
        usd_amount = parse_usd(row[9]) if len(row) > 9 else None

        # 원화 배당금: col 10
        krw_amount = parse_krw(row[10]) if len(row) > 10 else None

        # 해외계좌 배당은 USD, 국내 ETF 배당은 KRW
        if usd_amount and usd_amount > 0:
            amount = usd_amount
            currency = 'USD'
        elif krw_amount and krw_amount > 0:
            amount = krw_amount
            currency = 'KRW'
        else:
            skipped += 1
            continue

        # holding 매핑 (ticker로 찾기)
        cur.execute("SELECT id FROM holding WHERE ticker = %s LIMIT 1", (ticker,))
        holding_row = cur.fetchone()
        holding_id = holding_row[0] if holding_row else None

        # ETF 코드 매핑 (숫자 코드)
        if not holding_id and ticker.isdigit():
            cur.execute("SELECT id FROM holding WHERE ticker = %s LIMIT 1", (ticker,))
            holding_row = cur.fetchone()
            holding_id = holding_row[0] if holding_row else None

        cur.execute(
            "INSERT INTO passive_income (holding_id, income_type, amount, currency, income_date, is_predicted, memo) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (holding_id, 'DIVIDEND', amount, currency, income_date, False, f'{ticker}')
        )
        count += 1

    print(f"  총 {count}건 추가 (holding 미매핑은 holding_id=NULL)")
    if skipped:
        print(f"  ⚠️ {skipped}건 금액 파싱 실패로 스킵")
    return count


# ── 4. 가계부 마이그레이션 (고정비 + 생활비 → cashflow_record) ──

# 시트 카테고리 → DB cashflow_category 매핑
EXPENSE_CATEGORY_MAP = {
    # 고정비
    '보험': ('고정비', '보험'),
    '통신비': ('고정비', '통신비'),
    '교통비': ('고정비', '교통비'),
    '도시가스': ('고정비', '주거비'),
    '전기': ('고정비', '주거비'),
    '관리비': ('고정비', '주거비'),
    '패스권': ('고정비', '구독료'),
    '기타고정비': ('고정비', '구독료'),
    '은행이자': ('고정비', '주거비'),
    # 생활비
    '식대': ('생활비', '식비'),
    '커피': ('생활비', '식비'),
    '의료비': ('비상금', '의료비'),
    '게임': ('생활비', '여가'),
    '기타비용': ('생활비', '쇼핑'),
    '특수': ('비상금', '경조사'),
}


def ensure_cashflow_categories(cur):
    """시트에는 있지만 DB에 없는 카테고리 추가"""
    # 이미 init.sql에서 기본 카테고리는 만들어져 있음
    # 추가 소분류가 필요하면 여기서 추가
    # 현재는 매핑으로 커버 가능
    pass


def resolve_cashflow_category_id(cur, parent_name: str, child_name: str) -> int | None:
    """대분류명 + 소분류명 → category_id"""
    cur.execute(
        "SELECT cc.id FROM cashflow_category cc "
        "JOIN cashflow_category cp ON cc.parent_id = cp.id "
        "WHERE cp.name = %s AND cc.name = %s",
        (parent_name, child_name)
    )
    row = cur.fetchone()
    return row[0] if row else None


def migrate_cashflow(sh, cur):
    print("\n=== 4. 가계부 마이그레이션 ===")

    cur.execute("DELETE FROM cashflow_record WHERE user_id = %s", (USER_ID,))

    count = 0
    unmapped = {}

    # 고정비
    ws = sh.worksheet('고정비')
    data = ws.get_all_values()
    for i, row in enumerate(data):
        if i < 2:
            continue
        if len(row) < 8:
            continue

        record_date = parse_date(row[1])  # 실제 거래일
        if not record_date:
            continue

        amount = parse_krw(row[6])
        if amount is None or amount == 0:
            continue
        amount = abs(amount)  # 지출은 양수로

        category_str = row[7].strip()
        if not category_str:
            continue

        mapping = EXPENSE_CATEGORY_MAP.get(category_str)
        if not mapping:
            unmapped[category_str] = unmapped.get(category_str, 0) + 1
            continue

        category_id = resolve_cashflow_category_id(cur, mapping[0], mapping[1])
        if not category_id:
            print(f"  ⚠️ DB 카테고리 없음: {mapping[0]}/{mapping[1]}")
            continue

        memo = row[5].strip()[:200] if len(row) > 5 and row[5].strip() else None

        cur.execute(
            "INSERT INTO cashflow_record (user_id, category_id, amount, record_date, memo) VALUES (%s, %s, %s, %s, %s)",
            (USER_ID, category_id, amount, record_date, memo)
        )
        count += 1

    # 생활비
    ws2 = sh.worksheet('생활비')
    data2 = ws2.get_all_values()
    for i, row in enumerate(data2):
        if i < 2:
            continue
        if len(row) < 8:
            continue

        record_date = parse_date(row[1])
        if not record_date:
            continue

        amount = parse_krw(row[6])
        if amount is None or amount == 0:
            continue
        amount = abs(amount)

        category_str = row[7].strip()
        if not category_str:
            continue

        mapping = EXPENSE_CATEGORY_MAP.get(category_str)
        if not mapping:
            unmapped[category_str] = unmapped.get(category_str, 0) + 1
            continue

        category_id = resolve_cashflow_category_id(cur, mapping[0], mapping[1])
        if not category_id:
            print(f"  ⚠️ DB 카테고리 없음: {mapping[0]}/{mapping[1]}")
            continue

        memo = row[5].strip()[:200] if len(row) > 5 and row[5].strip() else None

        cur.execute(
            "INSERT INTO cashflow_record (user_id, category_id, amount, record_date, memo) VALUES (%s, %s, %s, %s, %s)",
            (USER_ID, category_id, amount, record_date, memo)
        )
        count += 1

    # 수입 (가계부 시트에서 월별 수입 → cashflow_record)
    ws3 = sh.worksheet('가계부')
    data3 = ws3.get_all_values()
    income_count = 0

    # 급여 카테고리 ID
    cur.execute("SELECT id FROM cashflow_category WHERE name = '급여' AND parent_id IS NOT NULL")
    salary_cat = cur.fetchone()
    salary_cat_id = salary_cat[0] if salary_cat else None

    cur.execute("SELECT id FROM cashflow_category WHERE name = '부수입' AND parent_id IS NOT NULL")
    extra_cat = cur.fetchone()
    extra_cat_id = extra_cat[0] if extra_cat else None

    for i, row in enumerate(data3):
        if i < 13:  # Row 14부터 월별 데이터
            continue
        if len(row) < 5:
            continue

        # 가계부 구조: [0:빈칸, 1:'2023-01', 2:급여, 3:기타수입, 4:총수입]
        month_str = row[1].strip()
        m = re.match(r'(\d{4})-(\d{2})', month_str)
        if not m:
            continue

        year = int(m.group(1))
        month = int(m.group(2))
        record_date = date(year, month, 1)

        # 급여 수입
        salary = parse_krw(row[2])
        if salary and salary > 0 and salary_cat_id:
            cur.execute(
                "INSERT INTO cashflow_record (user_id, category_id, amount, record_date, memo) VALUES (%s, %s, %s, %s, %s)",
                (USER_ID, salary_cat_id, salary, record_date, f'{month_str} 급여')
            )
            income_count += 1

        # 기타 수입
        extra = parse_krw(row[3])
        if extra and extra > 0 and extra_cat_id:
            cur.execute(
                "INSERT INTO cashflow_record (user_id, category_id, amount, record_date, memo) VALUES (%s, %s, %s, %s, %s)",
                (USER_ID, extra_cat_id, extra, record_date, f'{month_str} 기타수입')
            )
            income_count += 1

    count += income_count

    if unmapped:
        print(f"  ⚠️ 매핑 안 된 카테고리:")
        for k, v in sorted(unmapped.items(), key=lambda x: -x[1]):
            print(f"      {k}: {v}건")

    print(f"  지출 {count - income_count}건 + 수입 {income_count}건 = 총 {count}건 추가")
    return count


# ── 메인 ──────────────────────────────────────────────
def main():
    print("🐾 꾹꾹이 Google Sheets → MySQL 마이그레이션 시작")
    print("=" * 60)

    sh = connect_sheets()
    conn = connect_db()
    cur = conn.cursor()

    try:
        # 계좌 보강: 국내계좌, 청년도약계좌 추가
        get_or_create_account(cur, '국내계좌', 'GENERAL', None)
        get_or_create_account(cur, '청년도약계좌', 'GENERAL', 8520000)
        conn.commit()
        print("✅ 계좌 보강 완료")

        # 1. 보유종목
        migrate_holdings(sh, cur)
        conn.commit()

        # 2. DCA
        migrate_dca(sh, cur)
        conn.commit()

        # 3. 배당금
        migrate_dividends(sh, cur)
        conn.commit()

        # 4. 가계부
        migrate_cashflow(sh, cur)
        conn.commit()

        # 결과 요약
        print("\n" + "=" * 60)
        print("📊 마이그레이션 결과")
        print("=" * 60)

        for table in ['account', 'holding', 'dca_record', 'passive_income', 'cashflow_record']:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            cnt = cur.fetchone()[0]
            print(f"  {table}: {cnt}건")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

    print("\n🐾 마이그레이션 완료!")


if __name__ == '__main__':
    main()
