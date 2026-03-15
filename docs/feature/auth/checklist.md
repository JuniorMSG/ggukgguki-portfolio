# 인증/인가 — 체크리스트

## 백엔드
- [x] User 엔티티에 password, role 필드 추가
- [x] Spring Security + JWT 의존성 추가
- [x] JWT 인프라 (JwtProperties, JwtProvider, JwtAuthenticationFilter)
- [x] SecurityConfig (공개 경로, CORS, CSRF, stateless)
- [x] 인증 API (signup, login, refresh)
- [x] 구글 OAuth2 로그인 (POST /api/auth/google)
- [x] 소유권 검증 (OwnershipChecker)
- [x] ADMIN 역할 — 소유권 검증 우회
- [x] 기존 API에 @AuthenticationPrincipal 적용
- [x] DTO에서 userId 파라미터 제거
- [x] 닉네임 설정 API (PUT /api/users/me/nickname)

## 프론트엔드
- [x] API 레이어에 Authorization 헤더 자동 첨부
- [x] 401 응답 시 refresh → 실패 시 /login 리다이렉트
- [x] AuthContext (login/signup/googleLogin/setNickname/logout)
- [x] 로그인 페이지 (이메일 + 구글)
- [x] 회원가입 페이지 (이메일 + 구글)
- [x] ProtectedRoute
- [x] 닉네임 설정 모달 (구글 첫 가입)
- [x] 프로필 페이지 (닉네임 변경)
- [x] 모든 페이지에서 USER_ID 하드코딩 제거
- [x] 환경변수 처리 (JWT_SECRET, GOOGLE_CLIENT_ID)
