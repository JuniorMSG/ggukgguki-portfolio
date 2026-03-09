# 꾹꾹이 (ggukgguki-portfolio)

> 고양이가 꾹꾹이 하듯, 매주 꾹꾹 기록하는 자산관리 포트폴리오 서비스

## 프로젝트 개요
- 기획서: `../msg-ai-context/plans/side-project-asset-saas.md`
- MSG의 3년간 Google Sheets 자산배분 포트폴리오를 웹 서비스로 전환

## 기술 스택
- Backend: Kotlin + Spring Boot 3.3 (멀티모듈)
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS (추후 shadcn/ui)
- DB: MySQL 8.0 + Redis 7
- Infra: Docker Compose (로컬) → AWS EC2 (운영)

## 모듈 구조
```
backend/
├── core/     → 순수 도메인 (엔티티, VO, Port)
├── api/      → REST API (Controller, Service)
├── batch/    → 스케줄링 (스냅샷, 주가/환율 수집)
└── client/   → 외부 API (Yahoo Finance, ECOS)

frontend/     → React + TypeScript + Vite

의존성: api → core / batch → core, client / client → core
원칙: core는 외부 의존 없이 순수 도메인
```

## 실행 방법
```bash
# DB 실행
docker-compose up -d

# 백엔드
cd backend && ./gradlew :api:bootRun

# 프론트엔드
cd frontend && npm run dev
```

## 설계 원칙
- DDD + 실용적 클린 아키텍처
- core 모듈은 외부 의존 없이 순수하게
- 과한 Port/Adapter 분리는 안 함
