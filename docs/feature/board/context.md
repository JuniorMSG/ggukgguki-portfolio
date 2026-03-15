# 게시판 — 배경 & 설계

## 개요

서비스 운영에 필요한 공지사항과 유저 피드백을 관리하는 게시판.
네비게이션 최좌측에 배치.

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
| 댓글 작성 | O | O |
| 좋아요/싫어요 | O | O |

### 데이터 모델 — 요청 (board_request)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| title | VARCHAR(200) | 제목 |
| content | TEXT | 내용 |
| author_id | BIGINT | 작성자 (FK → users) |
| category | VARCHAR(20) | 카테고리 |
| status | VARCHAR(20) | 상태 |
| like_count | INT | 좋아요 수 |
| dislike_count | INT | 싫어요 수 |
| view_count | INT | 조회수 |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### 데이터 모델 — 댓글 (board_comment)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| request_id | BIGINT | FK → board_request |
| author_id | BIGINT | 작성자 (FK → users) |
| content | TEXT | 댓글 내용 |
| is_admin_reply | BOOLEAN | 관리자 답변 여부 (강조 표시용) |
| created_at | DATETIME | 작성일 |
| updated_at | DATETIME | 수정일 |

### 데이터 모델 — 좋아요/싫어요 (board_vote)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| request_id | BIGINT | FK → board_request |
| user_id | BIGINT | FK → users |
| vote_type | VARCHAR(10) | LIKE / DISLIKE |
| created_at | DATETIME | 작성일 |
| UNIQUE | (request_id, user_id) | 유저당 1회 |

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

## 3. UI 구조

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
요청사항           [검색...]     [기능요청] [버그] [개선] [기타]
┌─────────────────────────────────────────────────────┐
│ [기능요청] 현재가 연동 해주세요   👍 12 👎 1  🟡 검토중  │
│ [개선] 대시보드에 차트 추가      👍 8  👎 0  🔵 진행중  │
│ [버그] ISA 한도 계산 오류       👍 3  👎 0  🟢 완료    │
│ [기타] 다크모드 지원            👍 5  👎 2  ⚪ 접수    │
└─────────────────────────────────────────────────────┘
```

## 4. API 설계

### 공지사항
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/notices | 목록 조회 |
| GET | /api/notices/{id} | 상세 조회 (+조회수 증가) |
| POST | /api/notices | 작성 (관리자) |
| PUT | /api/notices/{id} | 수정 (관리자) |
| DELETE | /api/notices/{id} | 삭제 (관리자) |

### 요청사항
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/requests | 목록 조회 (필터: category, status, keyword) |
| GET | /api/requests/{id} | 상세 조회 (+조회수 증가) |
| POST | /api/requests | 작성 |
| PUT | /api/requests/{id} | 수정 |
| DELETE | /api/requests/{id} | 삭제 |
| PUT | /api/requests/{id}/status | 상태 변경 (관리자) |
| POST | /api/requests/{id}/vote | 좋아요/싫어요 (toggle) |
| GET | /api/requests/{id}/comments | 댓글 목록 |
| POST | /api/requests/{id}/comments | 댓글 작성 |
| DELETE | /api/comments/{id} | 댓글 삭제 |
