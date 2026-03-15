# 인증/인가 — 배경 & 설계

## 배경

- 기존에 `USER_ID = 1` 하드코딩 싱글유저 → 다중 사용자 지원 필요
- URL 파라미터로 다른 유저 데이터 접근 가능한 보안 이슈 존재

## 인증 방식

- **이메일 + 비밀번호**: BCrypt 해시 저장, JWT 토큰 발급
- **구글 OAuth2**: 프론트에서 Google Sign-In → 백엔드에서 ID 토큰 검증 → JWT 발급
- 구글 첫 가입 시 닉네임 설정 모달 표시

## 토큰

- Access Token: 30분
- Refresh Token: 7일
- 프론트: localStorage 저장, fetchJson에 자동 첨부
- 401 응답 시 refresh 시도 → 실패 시 /login 리다이렉트

## 역할 (Role)

| 역할 | 설명 |
|------|------|
| USER | 일반 유저, 본인 데이터만 접근 |
| ADMIN | 관리자, 소유권 검증 우회 (모든 데이터 접근) |

## 소유권 검증 (OwnershipChecker)

- Account → `account.user.id == userId`
- Holding → `holding.account.user.id == userId`
- DcaRecord → `dca.account.user.id == userId`
- CashAsset → `cashAsset.user.id == userId`
- ADMIN 역할은 검증 우회

## 환경변수

- `JWT_SECRET` — JWT 서명 키 (프로덕션 필수)
- `GOOGLE_CLIENT_ID` — 구글 OAuth 클라이언트 ID
- `VITE_GOOGLE_CLIENT_ID` — 프론트엔드용 (`.env`)
