# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 한다.

🌐 **Production**: https://miniplay.kr
📦 **Repo**: https://github.com/mooburg/miniplay

## 기술 스택

- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v3
- 상태 관리: Zustand v5 (`store/gameStore.ts`)
- 오디오: Web Audio API 기반 (외부 파일/라이브러리 없음)
- 폰트: Jua (Google Fonts, `next/font`)
- PWA: `@ducanh2912/next-pwa` + 커스텀 Service Worker (`worker/index.js`)
- 푸시 알림: `web-push` + Redis (`lib/push-subscriptions.ts`)
- 분석: Google Analytics 4 (`lib/gtag.ts`)
- 배포: Vercel

## 개발 명령어

```bash
npm run dev      # 로컬 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 게임 라우팅

| 경로 | 게임 | 참여자 필요 |
| --- | --- | --- |
| `/` | 홈 허브 | - |
| `/game/roulette` | 숫자 룰렛 | X (선택 시 턴/벌칙 활성화) |
| `/game/spin` | 화살표 스핀 | X |
| `/game/croc` | 악어 이빨 | X (선택 시 턴/벌칙 활성화) |
| `/game/mole` | 쏙쏙 햄찌 | X (선택 시 턴/벌칙 활성화) |
| `/game/bomb` | 째깍 폭탄 | X (선택 시 턴/벌칙 활성화) |
| `/game/balloon` | 풍선 팡 | X (선택 시 턴/벌칙 활성화) |

## 새 게임 추가 방법

1. `types/index.ts`의 `GameType` 유니온과 `GAMES` 배열에 추가
2. `app/game/<id>/page.tsx` 생성 (`'use client'`)
3. 홈 카드 자동 노출 + 라우팅 완료

모든 게임은 참여자 없이도 플레이 가능하며, 참여자가 있으면 턴/벌칙 시스템이 자동 활성화된다.
자세한 가이드: `docs/add-game.md`

## 프로젝트 구조

```
app/
├── layout.tsx              # 루트 레이아웃 (폰트, GA, PWA 트래킹)
├── page.tsx                # 홈 허브 (Server Component)
├── api/feedback/           # 피드백 → GitHub Issue 자동 생성
├── api/push/               # subscribe / unsubscribe / send
└── game/*/page.tsx         # 각 게임 (모두 'use client')

components/
├── BgmToggle.tsx           # BGM 토글 버튼
├── FeedbackButton.tsx      # 피드백 모달 (→ GitHub Issue)
├── GameCard.tsx            # 홈 게임 카드
├── InstallPrompt.tsx       # iOS PWA 설치 안내 배너
├── NotificationToggle.tsx  # 푸시 알림 토글
├── PenaltyOverlay.tsx      # 벌칙 전체화면 오버레이
├── PlayerSetup.tsx         # 참여자 관리 (최대 6명)
├── PwaTracker.tsx          # PWA 설치/실행 GA 이벤트
├── ScoreBar.tsx            # 참여자 칩 + 드래그 정렬
└── TurnBadge.tsx           # 현재 턴 배지

hooks/
├── useAudio.ts             # 효과음 (Web Audio API 합성)
└── useBgm.ts               # BGM 생성 + Zustand 토글 상태

store/
└── gameStore.ts            # 전역 상태 (플레이어, 점수, 턴)

lib/
├── gtag.ts                 # GA4 이벤트 + PWA 트래킹
├── push-client.ts          # 클라이언트 푸시 구독/해제
└── push-subscriptions.ts   # 서버 Redis 푸시 구독 관리

types/
├── index.ts                # GameType, GameMeta, GAMES 배열
├── push.ts                 # PushNotificationPayload
├── css.d.ts                # CSS 모듈 타입
└── web-push.d.ts           # web-push 패키지 타입

worker/
└── index.js                # Service Worker (푸시 수신/클릭)

scripts/
└── generate-icons.mjs      # PWA 아이콘 생성
```

## 코드 규칙

### 상태 관리
- 게임 간 공유 상태(플레이어, 점수, 턴): `useGameStore()` (Zustand)
- 게임 내부 상태(타이머, UI): 각 페이지의 `useState`
- 플레이어 목록은 `localStorage`에 `miniplay-players` 키로 자동 저장

### 사운드
- 효과음: `useAudio` 훅 (`playClick`, `playDanger`, `playFanfare`, `playPump`, `playPop`, `playExplosion` 등)
- BGM: `useBgm` 훅 + `BgmToggle` 컴포넌트 (160BPM, C 메이저, 8마디 루프)
- AudioContext는 사용자 인터랙션 시점에 lazy 초기화 (브라우저 정책 대응)

### 스타일링
- 배경 그라디언트는 `globals.css`의 `body`에서 고정. 게임 페이지에서 변경 금지.
- 게임 래퍼: `className="game-screen"` 사용
- 모든 텍스트에 `font-jua` 적용
- 액션 버튼: `action-btn` 클래스로 상단 광택 효과
- 인라인 스타일은 `box-shadow`, 동적 색상 등 Tailwind로 표현 불가한 경우만 허용
- 커스텀 keyframe은 `tailwind.config.ts`의 `theme.extend`에 추가
- 커스텀 색상: `pastel` 팔레트 (pink, rose, magenta, purple, blue, yellow)

### 타이머
- 타이머가 있는 게임은 반드시 `useRef` + `useEffect` cleanup으로 해제
- 페이지 이동 시 메모리 누수 방지 필수

### 서버/클라이언트 컴포넌트
- `app/page.tsx` (홈): Server Component — `useGameStore`를 직접 사용하지 않는다
- `app/game/*/page.tsx`: 모두 `'use client'`
- `TurnBadge`, `ScoreBar`: `'use client'` 불필요 (단순 표시 컴포넌트)

### 벌칙 흐름 (참여자 기반 게임)
게임에서 패배 → `addPenalty(turn)` → `setPenaltyPlayer(name)` → `PenaltyOverlay` 렌더 → "다시 하기" or "홈으로"

### API 라우트
- `POST /api/feedback` — 피드백을 GitHub Issue로 자동 생성 (`GITHUB_TOKEN` 필요)
- `POST /api/push/subscribe` — 푸시 구독 등록 (Redis)
- `POST /api/push/unsubscribe` — 푸시 구독 해제
- `POST /api/push/send` — 전체 발송 (`PUSH_ADMIN_SECRET` 인증)

### 환경 변수
- `GITHUB_TOKEN` — 피드백 Issue 생성용
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — VAPID 공개키
- `VAPID_PRIVATE_KEY` — VAPID 비공개키
- `REDIS_URL` — Redis 연결 URL
- `PUSH_ADMIN_SECRET` — 푸시 발송 인증 토큰
