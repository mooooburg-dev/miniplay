# 사운드 시스템

miniplay의 모든 사운드는 **외부 오디오 파일 없이** Web Audio API로 실시간 합성됩니다.

## 효과음 (useAudio)

`hooks/useAudio.ts`에서 제공하는 효과음 훅입니다.

### 사용법

```typescript
const { playClick, playDanger, playFanfare } = useAudio();

// 버튼 클릭 시
<button onClick={() => { playClick(); /* 게임 로직 */ }}>
```

### 효과음 목록

| 함수 | 용도 | 사운드 |
| --- | --- | --- |
| `playClick` | 일반 클릭/선택 | 짧은 톤 |
| `playTick` | 타이머 틱 | 가벼운 틱 |
| `playBeep` | 경고/알림 | 비프음 |
| `playSafe` | 안전 통과 | 안도 사운드 |
| `playDanger` | 위험 상황 | 긴장감 있는 톤 |
| `playFanfare` | 성공/완료 | 팡파레 |
| `playPenalty` | 벌칙 확정 | 실패 사운드 |
| `playPump` | 풍선 펌프 | 펌프 소리 |
| `playPop` | 터지는 효과 | 팝 사운드 |
| `playBombTick` | 폭탄 째깍 | 긴장감 있는 틱 |
| `playExplosion` | 폭발 | 폭발음 |

### 내부 구현

- `tone(freq, duration, type)` — 오실레이터로 단음 생성
- `noiseBurst(duration)` — 노이즈 버퍼로 폭발/충격 효과 생성
- 공유 `AudioContext` 인스턴스 사용 (메모리 효율)

## BGM (useBgm)

`hooks/useBgm.ts`에서 제공하는 BGM 시스템입니다.

### 구성

- **BPM**: 160
- **키**: C 메이저
- **구조**: 8마디 루프
- **파트**: 멜로디 + 아르페지오 + 펑키 베이스 + 드럼 (킥/스네어/하이햇/셰이커)

### 상태 관리

```typescript
import { useBgmStore } from '@/hooks/useBgm';

const { playing, toggle } = useBgmStore();
```

- `playing` — 현재 재생 상태 (boolean)
- `toggle()` — 재생/정지 토글
- `setPlaying(bool)` — 직접 제어

### UI 컴포넌트

`BgmToggle` 컴포넌트가 화면 우상단에 고정 표시되며, 사운드 아이콘으로 ON/OFF를 나타냅니다.

## 브라우저 정책 대응

모든 브라우저는 사용자 인터랙션 없이는 오디오 재생을 차단합니다.

- `AudioContext`는 첫 사용자 클릭/터치 시점에 lazy 생성
- `useBgm`은 첫 인터랙션에서 `AudioContext`를 unlock한 후 재생 시작
- `resume()` 호출로 suspended 상태 복구 처리
