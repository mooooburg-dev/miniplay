# 아키텍처 개요

## 전체 구조

miniplay는 Next.js 15 App Router 기반의 PWA 앱으로, 가족이 함께 즐기는 미니게임 모음입니다.

```
┌─────────────────────────────────────────────────┐
│                   Vercel (배포)                    │
├─────────────────────────────────────────────────┤
│  Next.js 15 App Router                          │
│  ┌───────────┐  ┌────────────────────────────┐  │
│  │ 홈 (SSR)   │  │ 게임 페이지 (CSR, 'use client') │  │
│  │ page.tsx   │  │ game/*/page.tsx (7개 게임)    │  │
│  └───────────┘  └────────────────────────────┘  │
│         │                    │                   │
│         ▼                    ▼                   │
│  ┌─────────────────────────────────────────┐    │
│  │         공유 컴포넌트 / 훅 레이어          │    │
│  │  components/  hooks/  store/  lib/       │    │
│  └─────────────────────────────────────────┘    │
│         │                    │                   │
│  ┌──────┴──────┐     ┌──────┴──────┐            │
│  │ Zustand     │     │ Web Audio   │            │
│  │ (전역 상태)  │     │ API (사운드) │            │
│  └─────────────┘     └─────────────┘            │
├─────────────────────────────────────────────────┤
│  API Routes                                      │
│  ┌──────────┐  ┌──────────────────────────┐     │
│  │ feedback  │  │ push (subscribe/send)    │     │
│  │ → GitHub  │  │ → Redis + web-push       │     │
│  └──────────┘  └──────────────────────────┘     │
├─────────────────────────────────────────────────┤
│  Service Worker (worker/index.js)                │
│  푸시 알림 수신 + 클릭 핸들링                       │
└─────────────────────────────────────────────────┘
```

## 렌더링 전략

| 페이지 | 렌더링 | 이유 |
| --- | --- | --- |
| `/` (홈) | Server Component | SEO + 빠른 초기 로드 |
| `/game/*` | Client Component | 인터랙션, 타이머, 오디오 필요 |
| API Routes | Server-only | GitHub API, Redis, web-push 등 서버 리소스 접근 |

## 상태 관리 계층

```
전역 (Zustand - gameStore)
├── players[]      ← localStorage 자동 동기화
├── scores[]
├── turn
└── currentGame

게임 로컬 (useState)
├── 타이머 상태
├── 애니메이션 상태
└── 게임 고유 로직
```

- **전역 상태**: 플레이어, 점수, 턴은 게임 간 공유되므로 Zustand로 관리
- **로컬 상태**: 타이머, UI 애니메이션 등 게임 고유 상태는 각 페이지의 `useState`로 관리
- **영속성**: 플레이어 목록만 `localStorage`에 저장 (`miniplay-players` 키)

## 데이터 흐름

### 게임 플레이 흐름

```
홈에서 게임 선택
  → setCurrentGame() + resetTurn()
  → 게임 페이지 마운트
  → useGameStore에서 players/turn 구독
  → 게임 로직 실행 (로컬 state)
  → 패배 시: addPenalty(turn) → PenaltyOverlay
  → "다시 하기" or "홈으로"
```

### 피드백 흐름

```
FeedbackButton 클릭
  → 모달에서 카테고리 + 메시지 입력
  → POST /api/feedback
  → GitHub Issue 자동 생성 (GITHUB_TOKEN)
```

### 푸시 알림 흐름

```
NotificationToggle ON
  → Notification.requestPermission()
  → pushManager.subscribe(VAPID)
  → POST /api/push/subscribe → Redis SET에 저장

관리자 발송
  → POST /api/push/send (Bearer 인증)
  → Redis에서 전체 구독 조회
  → web-push로 일괄 발송
  → 만료된 구독(410/404) 자동 정리
```

## PWA 구성

- `@ducanh2912/next-pwa`로 Service Worker 자동 생성 + 커스텀 워커 병합
- `worker/index.js`에서 `push` / `notificationclick` 이벤트 처리
- `manifest.ts`에서 PWA 메타데이터 정의
- `InstallPrompt` 컴포넌트: iOS 환경에서 홈 화면 추가 안내
- `PwaTracker` 컴포넌트: 설치/스탠드얼론 실행 GA 이벤트 추적
