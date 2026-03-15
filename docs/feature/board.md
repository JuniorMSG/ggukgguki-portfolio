# 게시판 기능 정의

## 개요

서비스 운영에 필요한 공지사항과 유저 피드백을 관리하는 게시판.
네비게이션 최좌측에 배치.

---

## 1. 공지사항

### 목적
관리자가 서비스 업데이트, 변경사항, 안내 등을 유저에게 전달.

### 권한
| 행위 | 일반 유저 | 관리자 |
|------|----------|--------|
| 목록 조회 | O | O |
| 상세 조회 | O | O |
| 작성 | X | O |
| 수정 | X | O |
| 삭제 | X | O |

### 데이터 모델
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| title | VARCHAR(200) | 제목 |
| content | TEXT | 내용 |
| author_id | BIGINT | 작성자 (FK → users) |
| is_pinned | BOOLEAN | 상단 고정 여부 |
| view_count | INT | 조회수 |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### 기능 상세
- 목록: 고정글 우선 → 최신순 정렬
- 상세: 제목, 내용, 작성일, 조회수
- 페이지네이션 (10건/페이지)

---

## 2. 요청사항

### 목적
유저가 기능 추가/버그/개선 등을 요청하고, 관리자가 상태를 관리.

### 권한
| 행위 | 일반 유저 | 관리자 |
|------|----------|--------|
| 목록 조회 | O | O |
| 상세 조회 | O | O |
| 작성 | O | O |
| 수정 | 본인만 | O |
| 삭제 | 본인만 | O |
| 상태 변경 | X | O |
| 답변 작성 | X | O |
| 추천 | O | O |

### 데이터 모델 — 요청 (request)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| title | VARCHAR(200) | 제목 |
| content | TEXT | 내용 |
| author_id | BIGINT | 작성자 (FK → users) |
| category | VARCHAR(20) | 카테고리 |
| status | VARCHAR(20) | 상태 |
| vote_count | INT | 추천수 |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### 데이터 모델 — 답변 (reply)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| request_id | BIGINT | FK → request |
| author_id | BIGINT | 작성자 (FK → users) |
| content | TEXT | 답변 내용 |
| created_at | DATETIME | 작성일 |

### 카테고리
| 값 | 라벨 |
|----|------|
| FEATURE | 기능 요청 |
| BUG | 버그 신고 |
| IMPROVEMENT | 개선 제안 |
| OTHER | 기타 |

### 상태 플로우
```
접수 (SUBMITTED)
  → 검토중 (REVIEWING)
    → 진행중 (IN_PROGRESS)
      → 완료 (DONE)
    → 보류 (ON_HOLD)
```

### 기능 상세
- 목록: 상태별 필터, 카테고리별 필터, 추천순/최신순 정렬
- 상세: 제목, 내용, 상태 뱃지, 카테고리, 추천수, 답변 목록
- 추천: 유저당 1회 (중복 불가)
- 페이지네이션 (10건/페이지)

---

## 3. UI 구조

### 네비게이션
```
[게시판 ▾] [대시보드] [자산] [자산배분] [DCA] [수입/지출] [계산기 ▾]
  ├── 공지사항
  └── 요청사항
```

### 공지사항 페이지
```
공지사항
┌─────────────────────────────────────────┐
│ 📌 [고정] 서비스 오픈 안내        2026-03-16 │
│ 📌 [고정] 이용 가이드             2026-03-16 │
│ v1.1 업데이트 안내              2026-03-20 │
│ 점검 예정 안내                  2026-03-25 │
└─────────────────────────────────────────┘
```

### 요청사항 페이지
```
요청사항                    [기능요청] [버그] [개선] [기타]
┌─────────────────────────────────────────────────┐
│ [기능요청] 현재가 연동 해주세요    👍 12  🟡 검토중  │
│ [개선] 대시보드에 차트 추가       👍 8   🔵 진행중  │
│ [버그] ISA 한도 계산 오류        👍 3   🟢 완료    │
│ [기타] 다크모드 지원             👍 5   ⚪ 접수    │
└─────────────────────────────────────────────────┘
```

---

## 4. API 설계

### 공지사항
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/notices | 목록 조회 |
| GET | /api/notices/{id} | 상세 조회 |
| POST | /api/notices | 작성 (관리자) |
| PUT | /api/notices/{id} | 수정 (관리자) |
| DELETE | /api/notices/{id} | 삭제 (관리자) |

### 요청사항
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/requests | 목록 조회 (필터: category, status) |
| GET | /api/requests/{id} | 상세 조회 |
| POST | /api/requests | 작성 |
| PUT | /api/requests/{id} | 수정 |
| DELETE | /api/requests/{id} | 삭제 |
| PUT | /api/requests/{id}/status | 상태 변경 (관리자) |
| POST | /api/requests/{id}/vote | 추천 |
| GET | /api/requests/{id}/replies | 답변 목록 |
| POST | /api/requests/{id}/replies | 답변 작성 (관리자) |

---

## 5. 구현 순서

1. DB 테이블 생성 (notice, request, request_reply, request_vote)
2. 백엔드 엔티티 + API
3. 프론트 공지사항 페이지 (목록 + 상세)
4. 프론트 요청사항 페이지 (목록 + 상세 + 작성)
5. 관리자 기능 (작성/상태변경/답변)
6. 추천 기능
