# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 한다.

🌐 **Production**: https://miniplay.kr
📦 **Repo**: https://github.com/mooburg/miniplay

## 기술 스택

- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v3
- 상태 관리: Zustand v5 (`store/gameStore.ts`)
- 오디오: Web Audio API 기반 (외부 파일/라이브러리 없음, BGM 합성은 Web Worker)
- 폰트: Jua (Google Fonts, `next/font`)
- PWA: `@ducanh2912/next-pwa` + 커스텀 Service Worker (`worker/index.js`)
- 푸시 알림: `web-push` + Redis (`lib/push-subscriptions.ts`)
- 분석: Google Analytics 4 (`lib/gtag.ts`) + Vercel Analytics / Speed Insights
- 공유: 카카오톡 공유 (`lib/kakao.ts`, Kakao JS SDK 동적 로드)
- 음성 인식: Web Speech API (`hooks/useSpeechRecognition.ts`, 국기 퀴즈 전용)
- 국기 이미지: `flag-icons`(MIT) SVG를 `public/flags/`에 자체 호스팅
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
| `/game/ladder` | 사다리 게임 | X (자체 참여자 설정, 스토어 플레이어 자동 반영) |
| `/game/flag` | 국기 퀴즈 | X (없으면 10문제 퀴즈, 있으면 턴제 + 틀리면 벌칙) |

## 새 게임 추가 방법

1. `types/index.ts`의 `GameType` 유니온과 `GAMES` 배열에 추가 (새 게임은 `isNew: true` 설정)
2. `app/game/<id>/page.tsx` 생성 (`'use client'`)
3. `lib/game-seo.ts`의 `GAME_SEO`에 SEO 데이터 추가 (제목·설명·키워드·소개·게임 방법·FAQ — 실제 규칙과 일치해야 함)
4. `app/game/<id>/layout.tsx` 생성 (`gameMetadata('<id>')` + `<GameGuide id="<id>" />` — 기존 게임 layout 복사)
5. `public/llms.txt`, `app/layout.tsx`의 description/keywords에 게임 추가
6. 홈 카드, 라우팅, sitemap, OG 이미지(`/og/<id>`) 자동 반영 (`isNew: true`이면 N 뱃지 표시)
7. 배포 후 `npm run indexnow`로 검색엔진에 색인 요청

모든 게임은 참여자 없이도 플레이 가능하며, 참여자가 있으면 턴/벌칙 시스템이 자동 활성화된다.
자세한 가이드: `docs/add-game.md`

## 프로젝트 구조

```
app/
├── layout.tsx              # 루트 레이아웃 (폰트, GA, PWA 트래킹, 루트 metadata)
├── page.tsx                # 홈 허브 (Server Component, JSON-LD)
├── manifest.ts / robots.ts / sitemap.ts  # PWA 매니페스트, SEO (sitemap은 GAMES 기반 자동 생성)
├── api/feedback/           # 피드백 → GitHub Issue 자동 생성
├── api/push/               # subscribe / unsubscribe / send
├── og/[id]/route.tsx       # 게임별 OG 이미지 (1200×630, 빌드 시 정적 생성, Jua 폰트·twemoji)
└── game/*/                 # 각 게임: page.tsx ('use client') + layout.tsx (gameMetadata + GameGuide)

components/
├── BgmToggle.tsx           # BGM 토글 버튼
├── FamilySiteBanner.tsx    # 홈 하단 골드박스 투데이 배너 (상호 링크, UTM)
├── FeedbackButton.tsx      # 피드백 모달 (→ GitHub Issue)
├── GameCard.tsx            # 홈 게임 카드
├── GameGuide.tsx           # 게임 화면 아래 "게임 방법"·FAQ + JSON-LD (Server)
├── HomeAbout.tsx           # 홈 하단 소개·상황별 추천·FAQ (Server)
├── InstallPrompt.tsx       # iOS PWA 설치 안내 배너
├── KakaoShareButton.tsx    # 카카오톡 공유 (홈 플로팅 / 벌칙 오버레이)
├── NotificationToggle.tsx  # 푸시 알림 토글
├── PenaltyOverlay.tsx      # 벌칙 전체화면 오버레이
├── PlayerSetup.tsx         # 참여자 관리 (최대 6명)
├── PwaTracker.tsx          # PWA 설치/실행 GA 이벤트
├── ScoreBar.tsx            # 참여자 칩 + 드래그 정렬
└── TurnBadge.tsx           # 현재 턴 배지

hooks/
├── useAudio.ts             # 효과음 (Web Audio API 합성)
├── useBgm.ts               # BGM 엔진 (랜덤 곡, 화면 전환 시 크로스페이드) + Zustand 토글 상태
└── useSpeechRecognition.ts # 1회 음성 인식 (ko-KR, iOS Safari 대응)

store/
└── gameStore.ts            # 전역 상태 (플레이어, 점수, 턴)

lib/
├── bgm-synth.ts            # BGM 합성기 (곡 데이터 → 스테레오 PCM, Worker에서도 실행)
├── bgm-tracks.ts           # BGM 곡 10개 데이터 (멜로디·코드·악기·드럼)
├── flags.ts                # 국기 퀴즈 데이터 (레벨별 나라, 별칭, matchCountry)
├── game-seo.ts             # 게임별 SEO 단일 출처 (메타데이터·게임 방법·FAQ·JSON-LD)
├── gtag.ts                 # GA4 이벤트 + PWA 트래킹
├── kakao.ts                # 카카오 SDK 로드 + 공유
├── push-client.ts          # 클라이언트 푸시 구독/해제
└── push-subscriptions.ts   # 서버 Redis 푸시 구독 관리

types/
├── index.ts                # GameType, GameMeta, GAMES 배열
├── push.ts                 # PushNotificationPayload
├── css.d.ts                # CSS 모듈 타입
├── kakao.d.ts              # Kakao SDK 타입
└── web-push.d.ts           # web-push 패키지 타입

worker/
└── index.js                # Service Worker (푸시 수신/클릭)

workers/
└── bgm.worker.ts           # BGM 렌더링 Web Worker (Service Worker와 별개)

scripts/
├── generate-icons.mjs      # PWA 아이콘 생성
├── indexnow.mjs            # IndexNow 색인 요청 (npm run indexnow — 운영 sitemap URL을 중앙·네이버 엔드포인트로 전송)
└── copy-flags.mjs          # lib/flags.ts의 나라 국기 SVG를 public/flags/로 복사

public/
├── flags/                  # 국기 SVG (flag-icons, MIT) — 커밋 대상
├── <indexnow-key>.txt      # IndexNow 키 검증 파일 (scripts/indexnow.mjs의 KEY와 동일)
└── llms.txt                # AI 검색용 사이트 설명 (게임 추가 시 갱신)

.github/workflows/
└── issue-slack-notify.yml  # 이슈 생성 시 Slack 알림 (의견함 → Issue → Slack)
```

## 코드 규칙

### 상태 관리
- 게임 간 공유 상태(플레이어, 점수, 턴): `useGameStore()` (Zustand)
- 게임 내부 상태(타이머, UI): 각 페이지의 `useState`
- 플레이어 목록은 `localStorage`에 `miniplay-players` 키로 자동 저장

### 사운드
- 효과음: `useAudio` 훅 (`playClick`, `playDanger`, `playFanfare`, `playPump`, `playPop`, `playExplosion` 등)
- BGM: `useBgm` 훅 + `BgmToggle` 컴포넌트 — 곡 10개 중 랜덤 재생, 경로 변경 시 1.6초 크로스페이드
- BGM 곡 추가/수정: `lib/bgm-tracks.ts` (표기법은 `docs/sound-system.md`)
- AudioContext는 사용자 인터랙션 시점에 lazy 초기화 (브라우저 정책 대응)

### 스타일링
- 배경 그라디언트는 `globals.css`의 `body`에서 고정. 게임 페이지에서 변경 금지.
- 게임 래퍼: `className="game-screen"` 사용 — 한 화면(100dvh) 고정 레이아웃 (아래 "모바일 터치·화면 고정" 참고)
- 모든 텍스트에 `font-jua` 적용
- 액션 버튼: `action-btn` 클래스로 상단 광택 효과
- 인라인 스타일은 `box-shadow`, 동적 색상 등 Tailwind로 표현 불가한 경우만 허용
- 커스텀 keyframe은 `tailwind.config.ts`의 `theme.extend`에 추가
- 커스텀 색상: `pastel` 팔레트 (pink, rose, magenta, purple, blue, yellow)

### SEO
- 게임 페이지 메타데이터는 `gameMetadata()`로만 만든다 — 자식 layout에서 `openGraph`를 직접 쓰면 루트의 og:image가 사라진다
- 게임 규칙을 바꾸면 `lib/game-seo.ts`의 소개·게임 방법·FAQ도 함께 수정한다
- 새 페이지/게임 배포 후 `npm run indexnow` (네이버 서치어드바이저 + api.indexnow.org)

### 국기 퀴즈
- 나라 추가/변경: `lib/flags.ts` 수정 후 `node scripts/copy-flags.mjs` 실행 → `public/flags/` 커밋
- 국기 이미지 `alt`에 정답(나라 이름)을 넣지 않는다
- 음성 대답은 미지원 브라우저에서 비활성화, 실패 시 보기(객관식)로 대체 (권한 거부·미지원이면 이후 문제도 보기 표시)
- 음성 인식: 마이크를 다시 누르면 `finish()`(최종 결과로 채점), 취소는 `stop()`(결과 버림)
- 국기 SVG는 SW precache에서 제외(`publicExcludes`)하고 전용 런타임 캐시(`flag-images`) 사용

### 모바일 터치·화면 고정
버튼을 누르다 화면이 끌려가지 않도록 게임 화면은 스크롤 없는 한 화면으로 유지한다.
- `.game-screen`이 있는 페이지는 html/body 스크롤이 잠긴다 (`globals.css`의 `:has()` 규칙)
- `.game-screen`은 `100dvh` 고정 + `touch-action: pan-y`(핀치 줌·더블탭 확대 차단), 내용이 넘칠 때만 내부 스크롤
- `min-h-screen`/`100vh` 금지 — 모바일 주소창 높이만큼 화면보다 커져 살짝 스크롤된다
- 상단 `pt-[4.25rem]`은 고정 버튼(홈·BGM), 하단 `pb-12`는 📖 게임 방법 버튼 자리
- 낮은 화면(아이폰 SE/8, 세로 740px 이하)은 `short:` 변형으로 촘촘하게 (`tailwind.config.ts`의 `screens.short`)
- 가로로 넓은 화면(패드 가로·데스크톱, 가로 방향 900px 이상)은 `wide:` 변형으로 2단 배치 (`screens.wide`, 예: 국기 퀴즈 국기 | 대답)
- 드래그하는 요소(참여자 칩 등)와 오버레이는 `touch-none`, 꾹 누르는 버튼은 `touch-none select-none` + `onContextMenu` 방지
- 게임 화면 위에 다른 고정 버튼을 추가할 때는 `top-4 left-4`(홈), `top-4 right-4`(BGM), `right-[4.25rem]`(알림) 자리를 피한다
- 새 게임은 375×667·390×844·아이패드에서 참여자 4명 상태로 넘침이 없는지 확인한다

### 타이머
- 타이머가 있는 게임은 반드시 `useRef` + `useEffect` cleanup으로 해제
- 페이지 이동 시 메모리 누수 방지 필수

### 서버/클라이언트 컴포넌트
- `app/page.tsx` (홈): Server Component — `useGameStore`를 직접 사용하지 않는다
- `app/game/*/page.tsx`: 모두 `'use client'`
- `TurnBadge`: `'use client'` 불필요 (단순 표시 컴포넌트)
- `ScoreBar`: 드래그 정렬(스토어 `swapPlayers`) 때문에 `'use client'`

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
- `NEXT_PUBLIC_KAKAO_APP_KEY` — 카카오톡 공유용 JavaScript 키

### 알려진 이슈
- `npm run lint`가 동작하지 않음: `eslint.config.mjs`는 ESLint 9 형식인데 설치된 버전은 ESLint 8.57
