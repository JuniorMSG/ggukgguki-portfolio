# 네비게이션 — 구현 계획

## 구현 파일

- `frontend/src/components/layout/Nav.tsx` — Dropdown 컴포넌트 + 메뉴 구성
- `frontend/src/App.tsx` — 라우트 정의 (공개/인증 분리)
- `frontend/src/pages/LandingPage.tsx` — 메인 랜딩 (기능 카드 Nav 구조에 맞춤)
- `frontend/src/components/ProtectedRoute.tsx` — 인증 필요 라우트 감싸기

## 설계 포인트

- Dropdown 컴포넌트를 공통화해서 게시판/자산관리/계산기 모두 재사용
- 로그인 상태에 따라 Nav 메뉴 조건부 렌더링
- 랜딩 페이지 기능 카드는 Nav 그룹(자산관리/게시판/계산기)별로 구성
- 새 기능 추가 시 LandingPage.tsx의 features 배열에도 반영
