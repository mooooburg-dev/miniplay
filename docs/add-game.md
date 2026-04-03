# 새 게임 추가 가이드

## 3단계로 새 게임 추가하기

### 1단계: 타입 등록

`types/index.ts`에서 `GameType` 유니온과 `GAMES` 배열에 추가합니다.

```typescript
// GameType 유니온에 추가
export type GameType = 'roulette' | 'croc' | 'bomb' | 'balloon' | 'mole' | 'spin' | 'newgame';

// GAMES 배열에 추가
export const GAMES: GameMeta[] = [
  // ... 기존 게임들
  {
    id: 'newgame',
    emoji: '🎯',
    name: '새 게임',
    desc: '게임 설명',
    color: 'from-blue-400 to-cyan-400',
    shadow: 'shadow-blue-400/40',
    path: '/game/newgame',
  },
];
```

### 2단계: 게임 페이지 생성

`app/game/newgame/page.tsx`를 생성합니다.

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import TurnBadge from '@/components/TurnBadge';
import ScoreBar from '@/components/ScoreBar';
import PenaltyOverlay from '@/components/PenaltyOverlay';
import { GAMES } from '@/types';
import { trackEvent } from '@/lib/gtag';

export default function NewGamePage() {
  const router = useRouter();
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore();
  const { playClick, playDanger, playFanfare } = useAudio();
  const meta = GAMES.find(g => g.id === 'newgame')!;

  // 참여자 유무에 따른 분기
  const hasPlayers = players.length > 0;

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
      {hasPlayers && <ScoreBar />}

      {/* 벌칙 오버레이 */}
      <PenaltyOverlay />
    </div>
  );
}
```

### 3단계: 완료

홈 화면에 게임 카드가 자동으로 노출되고 라우팅이 완료됩니다.

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
- [ ] `className="game-screen"` 래퍼 사용
- [ ] 타이머 사용 시 `useRef` + `useEffect` cleanup
- [ ] 참여자 없이도 플레이 가능하도록 구현
- [ ] 사운드 효과 적용 (`useAudio`)
- [ ] GA 이벤트 추적 (`trackEvent`)
