# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 한다.

🌐 **Production**: https://miniplay.kr
📦 **Repo**: https://github.com/mooburg/miniplay

---

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v3
- **State**: Zustand v5
- **Font**: Jua (Google Fonts, next/font)
- **Audio**: Web Audio API (외부 라이브러리 없음)
- **Deploy**: Vercel

---

## 프로젝트 구조

```
miniplay/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Jua 폰트, 메타데이터, 애널리틱스)
│   ├── globals.css         # Tailwind base + 공통 스타일
│   ├── manifest.ts         # PWA 매니페스트 설정
│   ├── page.tsx            # 홈 허브 (게임 카드 목록)
│   ├── icon.png            # 파비콘 (32x32)
│   ├── apple-icon.png      # Apple Touch Icon (180x180)
│   ├── api/feedback/       # 피드백 API 라우트
│   └── game/
│       ├── roulette/page.tsx
│       ├── croc/page.tsx
│       ├── bomb/page.tsx
│       └── balloon/page.tsx
├── components/
│   ├── GameCard.tsx        # 홈의 게임 선택 카드
│   ├── PlayerSetup.tsx     # 플레이어 이름 설정 UI
│   ├── TurnBadge.tsx       # "🌟 엄마 차례!" 배지
│   ├── ScoreBar.tsx        # 플레이어별 점수 칩
│   ├── PenaltyOverlay.tsx  # 벌칙 풀스크린 오버레이
│   ├── BgmToggle.tsx       # BGM 토글 버튼
│   ├── FeedbackButton.tsx  # 피드백 제출 버튼
│   └── InstallPrompt.tsx   # iOS PWA 설치 안내
├── store/
│   └── gameStore.ts        # Zustand 전역 상태
├── hooks/
│   ├── useAudio.ts         # Web Audio API 효과음 엔진
│   └── useBgm.ts           # Web Audio API BGM 엔진
├── lib/
│   └── gtag.ts             # Google Analytics 연동
└── types/
    └── index.ts            # 타입 정의 + GAMES 메타 배열
```

---

## 개발 명령어

```bash
npm run dev      # 로컬 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

---

## 핵심 아키텍처

### 상태 관리 (Zustand)

`store/gameStore.ts`에 플레이어·점수·턴 등 게임 전반에 걸쳐 공유되는 상태를 관리한다.
게임별 내부 상태(타이머, 이빨 배열 등)는 각 페이지의 `useState`로 관리한다.

```ts
const { players, scores, turn, nextTurn, addPenalty } = useGameStore();
```

### 사운드

모든 오디오는 Web Audio API 기반으로 외부 파일 없이 동작한다.
AudioContext는 사용자 인터랙션 시점에 lazy 초기화된다 (브라우저 정책 대응).

- **효과음** (`useAudio`): `playClick`, `playDanger`, `playFanfare`, `playPenalty`, `playPump`, `playPop`, `playBombTick`, `playExplosion` 등
- **BGM** (`useBgm`): 8마디 루핑 신디사이저 BGM (160 BPM, C Major). `BgmToggle` 컴포넌트로 토글.

```ts
const { playClick, playDanger, playFanfare, playPenalty } = useAudio();
const { isPlaying, toggle } = useBgm();
```

### 라우팅

| 경로             | 설명      |
| ---------------- | --------- |
| `/`              | 홈 허브   |
| `/game/roulette` | 숫자 룰렛 |
| `/game/croc`     | 악어 이빨 |
| `/game/bomb`     | 째깍 폭탄 |
| `/game/balloon`  | 풍선 팡   |

### 벌칙 흐름

게임에서 패배 조건 충족 → `addPenalty(turn)` 호출 → `setPenaltyPlayer(name)` → `PenaltyOverlay` 렌더 → "다시 하기" or "홈으로"

---

## 새 게임 추가하는 방법

### 1. `types/index.ts` — GAMES 배열에 추가

```ts
{
  id: '새게임id',
  emoji: '🎯',
  name: '게임 이름',
  desc: '한 줄 설명',
  color: '#hex',
  shadow: '#hex',
  path: '/game/새게임id',
}
```

### 2. `app/game/새게임id/page.tsx` 생성

아래 구조를 따른다.

```tsx
'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import { TurnBadge } from '@/components/TurnBadge';
import { ScoreBar } from '@/components/ScoreBar';
import { PenaltyOverlay } from '@/components/PenaltyOverlay';

export default function NewGamePage() {
  const router = useRouter();
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore();
  const { playClick, playDanger } = useAudio();
  const [penaltyPlayer, setPenaltyPlayer] = useState('');

  const handleLose = useCallback(() => {
    addPenalty(turn);
    setPenaltyPlayer(players[turn]);
  }, [turn, players, addPenalty]);

  const reset = useCallback(() => {
    setPenaltyPlayer('');
    // 게임 상태 초기화
  }, []);

  return (
    <>
      <div className="game-screen">
        <button onClick={() => router.push('/')} className="...">
          ← 홈으로
        </button>
        <TurnBadge playerName={players[turn]} color="#hex" shadowColor="#hex" />
        <ScoreBar
          players={players}
          scores={scores}
          currentTurn={turn}
          activeColor="#hex"
        />
        {/* 게임 UI */}
      </div>
      <PenaltyOverlay
        isOpen={!!penaltyPlayer}
        loserName={penaltyPlayer}
        onRetry={reset}
      />
    </>
  );
}
```

이 두 단계만으로 홈 카드 자동 노출 + 라우팅 + 벌칙 화면까지 동작한다.

---

## 스타일링 규칙

- **배경**: `globals.css`의 `body` 그라디언트 고정. 게임 페이지에서 변경 금지.
- **게임 래퍼**: `className="game-screen"` 공통 클래스 사용.
- **폰트**: 모든 텍스트에 `font-jua` 적용 (`font-family: var(--font-jua)`).
- **버튼 광택**: 액션 버튼에 `action-btn` 클래스 추가 시 상단 광택 효과 자동 적용.
- **인라인 스타일**: Tailwind 임의값으로 표현하기 어려운 `box-shadow`, 동적 색상에만 허용.
- **애니메이션**: 커스텀 keyframe은 `tailwind.config.ts`의 `theme.extend`에 추가.

---

## 타이머 관리 규칙

타이머가 있는 게임(bomb 등)은 반드시 `useEffect` cleanup으로 해제한다.

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

페이지 이동 시 타이머 미해제로 인한 메모리 누수 및 오작동을 방지한다.

---

## 서버/클라이언트 컴포넌트 규칙

- `app/page.tsx` (홈): **Server Component** — `useGameStore`를 직접 사용하지 않는다.
  `GameCard`, `PlayerSetup`이 `'use client'`로 클라이언트 상태를 처리한다.
- `app/game/*/page.tsx`: 모두 `'use client'` — 게임 로직은 전부 클라이언트 사이드.
- `components/`: `PenaltyOverlay`, `GameCard`, `PlayerSetup`, `BgmToggle`, `FeedbackButton`, `InstallPrompt`는 `'use client'`.
  `TurnBadge`, `ScoreBar`는 단순 표시 컴포넌트로 `'use client'` 불필요.

---

## 향후 계획 (Phase 2)

- [ ] 카카오 로그인 (NextAuth.js)
- [ ] 플레이어 이름 저장 (Supabase)
- [ ] 게임 플레이 로그 (익명 트래킹)
- [ ] 게임 방 코드 기능 (Jackbox 스타일)
- [ ] 새 게임 추가: 제기차기, 눈치게임 등
