# 인증/인가 — 구현 계획

## 백엔드

- `security/JwtProperties.kt` — 설정값 바인딩
- `security/JwtProvider.kt` — 토큰 생성/검증/userId/role 추출
- `security/JwtAuthenticationFilter.kt` — Authorization 헤더 → SecurityContext
- `security/SecurityConfig.kt` — 공개 경로, CORS, CSRF, 필터 등록
- `security/OwnershipChecker.kt` — 리소스 소유권 검증 (ADMIN 우회)
- `security/SecurityExceptionHandler.kt` — 401/403 예외 핸들링
- `dto/AuthDto.kt` — Login/Signup/Google/Refresh/Nickname DTO
- `service/AuthService.kt` — 회원가입, 로그인, 구글 로그인, 닉네임 설정, 토큰 갱신
- `controller/AuthController.kt` — POST signup/login/google/refresh

## 프론트엔드

- `api/index.ts` — fetchJson에 Authorization 헤더, 401 refresh, authApi/userApi
- `contexts/AuthContext.tsx` — 인증 상태, login/signup/googleLogin/setNickname/logout
- `components/ProtectedRoute.tsx` — 미인증 시 /login 리다이렉트
- `components/NicknameModal.tsx` — 구글 첫 가입 시 닉네임 설정
- `pages/LoginPage.tsx` — 이메일 로그인 + 구글 로그인 버튼
- `pages/SignupPage.tsx` — 이메일 회원가입 + 구글 로그인 버튼
- `pages/ProfilePage.tsx` — 닉네임 변경, 로그아웃
