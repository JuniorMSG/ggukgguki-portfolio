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

### 아키텍처
- DDD + 실용적 클린 아키텍처
- core 모듈은 외부 의존 없이 순수하게
- 과한 Port/Adapter 분리는 안 함
- 의존 방향 엄수: controller → service → repository (역방향 금지)

### 소프트웨어 개발 원칙
- **SOLID 원칙 준수**:
  - **SRP**: 클래스/함수는 하나의 책임만. 변경 이유가 2개 이상이면 분리
  - **OCP**: 확장에 열려있고 수정에 닫혀있게. 새 기능은 기존 코드 수정 없이 추가 가능하도록
  - **LSP**: 상위 타입을 하위 타입으로 교체해도 동작이 깨지지 않게
  - **ISP**: 사용하지 않는 메서드에 의존하지 않도록 인터페이스 분리
  - **DIP**: 구체 클래스가 아닌 추상(인터페이스)에 의존
- **응집도 높고 결합도 낮게**: 한 파일에 여러 책임을 때려박지 않는다
- **DRY**: 같은 로직 반복 금지, 공통 로직은 hooks/utils/helper로 추출
- **KISS**: 불필요한 복잡성 배제, 단순하게 해결 가능하면 단순하게
- **YAGNI**: 지금 필요하지 않은 기능은 미리 만들지 않는다
- 파일 하나가 150줄 넘어가면 분리 검토

### API 문서화
- API 작업 시 Swagger 문서도 함께 작성한다 (빠뜨리지 않는다)
- Controller: `@Tag` + `@Operation(summary, description)`
- DTO: `@Schema(description, example)`

### DDD 적용 기준
- 도메인별 패키지 분리 (Aggregate 단위)
- Entity와 VO 구분: 금액/비중 같은 값은 VO 검토
- 비즈니스 로직은 가급적 도메인 객체 안에 (빈약한 도메인 모델 지양)
- 복잡한 도메인 로직은 Domain Service로 분리
- Application Service(api 모듈)는 흐름 제어만, 비즈니스 판단은 도메인에 위임

### 프론트엔드
- 컴포넌트는 UI 렌더링에 집중, 비즈니스 로직은 hooks로 분리
- API 호출은 api/ 모듈에 집중 (컴포넌트에서 직접 fetch 금지)
- 타입 정의는 types/에 모아두기
- 페이지 컴포넌트와 재사용 컴포넌트 분리 (pages/ vs components/)
