# 새 게임 추가 가이드

## 3단계로 새 게임 추가하기

### 1단계: 타입 등록

`types/index.ts`에서 `GameType` 유니온과 `GAMES` 배열에 추가합니다.

```typescript
// GameType 유니온에 추가
export type GameType = 'roulette' | 'croc' | 'bomb' | 'balloon' | 'mole' | 'spin' | 'ladder' | 'flag' | 'newgame';

// GAMES 배열에 추가
export const GAMES: GameMeta[] = [
  // ... 기존 게임들
  {
    id: 'newgame',
    emoji: '🎯',
    name: '새 게임',
    desc: '게임 설명',
    color: '#3b82f6',
    shadow: '#93c5fd',
    path: '/game/newgame',
    isNew: true,  // 신규 게임 N 뱃지 표시 (출시 후 제거)
  },
];
```

### 2단계: 게임 페이지 생성

`app/game/newgame/page.tsx`를 생성합니다.

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import { TurnBadge } from '@/components/TurnBadge';
import { ScoreBar } from '@/components/ScoreBar';
import { PenaltyOverlay } from '@/components/PenaltyOverlay';
import { GAMES } from '@/types';
import { trackEvent } from '@/lib/gtag';

export default function NewGamePage() {
  const router = useRouter();
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore();
  const { playClick, playDanger, playFanfare } = useAudio();
  const meta = GAMES.find(g => g.id === 'newgame')!;

  // 참여자 유무에 따른 분기
  const hasPlayers = players.length > 0;

  // 벌칙 대상 (빈 문자열이면 오버레이 닫힘)
  const [penaltyPlayer, setPenaltyPlayer] = useState('');
  const reset = () => setPenaltyPlayer('');

  // 타이머 사용 시 반드시 ref + cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="game-screen">
      {/* 턴 배지 (참여자 있을 때만) */}
      {hasPlayers && (
        <TurnBadge
          playerName={players[turn]}
          color={meta.color}
          shadowColor={meta.shadow}
        />
      )}

      {/* 게임 UI */}
      {/* ... */}

      {/* 스코어바 (참여자 있을 때만) */}
      {hasPlayers && (
        <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor={meta.color} />
      )}

      {/* 벌칙 오버레이 */}
      <PenaltyOverlay isOpen={!!penaltyPlayer} loserName={penaltyPlayer} onRetry={reset} />
    </div>
  );
}
```

### 3단계: SEO 데이터와 layout

`lib/game-seo.ts`의 `GAME_SEO`에 항목을 추가합니다. 소개·게임 방법·FAQ는 페이지 하단에 실제로 노출되고 JSON-LD에도 들어가므로 **실제 게임 규칙과 정확히 일치**해야 합니다.

```typescript
newgame: {
  title: '새 게임 🎯 - 한 줄 설명',
  description: '검색 결과·공유 미리보기에 노출될 설명',
  keywords: ['검색 키워드', ...],
  intro: '게임 소개 한 문단',
  howTo: ['1단계', '2단계', '3단계'],
  faq: [{ q: '질문', a: '답변' }],
},
```

`app/game/newgame/layout.tsx`를 생성합니다. (page.tsx가 `'use client'`라 metadata는 layout에서 export)

```typescript
import { gameMetadata } from '@/lib/game-seo'
import { GameGuide } from '@/components/GameGuide'

export const metadata = gameMetadata('newgame')

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameGuide id="newgame" />
    </>
  )
}
```

> ⚠️ layout에서 `openGraph`를 직접 작성하지 마세요. Next.js는 자식의 `openGraph`로 루트 값을 통째로 덮어써서 og:image가 사라집니다. `gameMetadata()`가 게임별 OG 이미지(`/og/<id>`)까지 넣어 줍니다.

`public/llms.txt` 게임 목록과 `app/layout.tsx`의 description/keywords에도 추가합니다.

### 4단계: 완료 및 색인 요청

홈 화면 카드, 라우팅, sitemap, OG 이미지가 자동으로 반영됩니다. 배포가 끝나면 `npm run indexnow`로 네이버·Bing 등에 색인을 요청합니다.

## 게임 페이지 필수 패턴

### 벌칙 처리 (참여자 기반)

```typescript
// 패배 조건 충족 시
addPenalty(turn);  // 현재 턴 플레이어에게 벌칙 추가
// PenaltyOverlay가 자동으로 렌더됨
```

### 턴 진행

```typescript
// 안전한 액션 후 다음 턴으로
nextTurn();
```

### 사운드 효과

```typescript
const { playClick, playDanger, playFanfare, playPump, playPop, playExplosion } = useAudio();

playClick();     // 일반 클릭/선택
playDanger();    // 위험 상황
playFanfare();   // 성공/완료
playPump();      // 풍선 펌프 등
playPop();       // 터지는 효과
playExplosion(); // 폭발
```

### GA 이벤트 추적

```typescript
trackEvent('game_start', { game: 'newgame' });
trackEvent('game_end', { game: 'newgame', result: 'penalty' });
```

### 타이머 안전 패턴

```typescript
const timerRef = useRef<NodeJS.Timeout | null>(null);

// 타이머 설정
timerRef.current = setTimeout(() => { /* ... */ }, 1000);

// 반드시 cleanup
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

## 체크리스트

- [ ] `types/index.ts`에 `GameType`과 `GAMES` 추가
- [ ] `app/game/<id>/page.tsx` 생성 (`'use client'`)
- [ ] `lib/game-seo.ts`에 SEO 데이터 추가 (실제 규칙과 일치)
- [ ] `app/game/<id>/layout.tsx` 생성 (`gameMetadata` + `GameGuide`)
- [ ] `public/llms.txt`, 루트 description/keywords 갱신
- [ ] 배포 후 `npm run indexnow`
- [ ] `className="game-screen"` 래퍼 사용
- [ ] 타이머 사용 시 `useRef` + `useEffect` cleanup
- [ ] 참여자 없이도 플레이 가능하도록 구현
- [ ] 사운드 효과 적용 (`useAudio`)
- [ ] GA 이벤트 추적 (`trackEvent`)
