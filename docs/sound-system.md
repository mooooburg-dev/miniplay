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

`hooks/useBgm.ts`의 BGM 엔진과 `lib/bgm-tracks.ts`(곡 데이터), `lib/bgm-synth.ts`(합성기)로 구성됩니다.

### 동작

- 곡 10개 중 하나를 **랜덤 재생**합니다 (8마디 루프).
- 화면(경로)이 바뀌면 다른 곡으로 **크로스페이드(1.6초)** 전환합니다. `BgmToggle`이 루트 레이아웃에 있어 `usePathname()` 변화를 감지합니다.
- 켜기/끄기는 0.5초 페이드, 첫 재생은 1초 페이드인입니다.
- 곡 합성은 **Web Worker**(`workers/bgm.worker.ts`)에서 처리해 화면이 멈추지 않습니다. Worker를 쓸 수 없으면 메인 스레드에서 합성합니다.
- 다음 곡은 미리 정해 렌더링해 두므로 전환 시 지연이 없습니다.
- 곡 하나가 수 MB라서 **현재 곡과 다음 곡 버퍼만** 메모리에 유지합니다.
- 비동기 렌더링 중 새 요청(전환·끄기)이 오면 세대 번호로 이전 결과를 버려 곡이 겹치지 않습니다.
- 페이드인 도중 전환되면 현재 음량에서 이어서 페이드아웃합니다 (`cancelAndHoldAtTime`, 미지원 브라우저는 직접 계산).
- Worker가 4초 안에 응답하지 않으면 메인 스레드에서 합성합니다.

### 곡 목록

| 곡 | BPM | 조성 | 리드 | 드럼 |
| --- | --- | --- | --- | --- |
| 두근두근 팝 (기존 BGM) | 160 | C 장조 | chip | pop |
| 장난감 행진 | 128 | F 장조 | square | march |
| 통통 셔플 | 112 (스윙) | G 장조 | triangle | shuffle |
| 해변 보사노바 | 118 | D 장조 | marimba | bossa |
| 8비트 모험 | 150 | A 단조 | pulse | chip |
| 살금살금 탐정 | 100 | D 단조 | pluck | sneaky |
| 달려라 레이스 | 172 | E 장조 | saw | driving |
| 꿈나라 오르골 | 92 | B♭ 장조 | musicbox | light |
| 정글 탐험 | 120 | G 믹솔리디안 | marimba | tribal |
| 신나는 디스코 | 124 | A 장조 | square | disco |

### 곡 추가하기

`lib/bgm-tracks.ts`의 `BGM_TRACKS`에 항목을 추가합니다.

```typescript
{
  name: '새 곡',
  bpm: 120,
  tonic: 60,          // 멜로디 0도의 MIDI 번호 (60 = C4)
  scale: MAJOR,       // MAJOR | MINOR | MIXOLYDIAN
  // 8분음표 단위, 마디(|)당 8칸. 숫자 = 음계 도수, `.` = 쉼표, `-` = 앞 음 연장
  melody: '0 2 4 2 0 . 4 . | ...',  // 8마디
  chords: '0 0 3 3 4 4 0 0 ...',    // 반 마디마다 코드 근음 도수 (16개)
  lead: 'square',     // chip | square | pulse | triangle | saw | marimba | pluck | musicbox
  bass: 'octave',     // octave | root8 | walk | bounce | bossa | pump
  chord: 'stab',      // pingpong | up16 | updown | stab | offbeat | pad | none
  drums: 'pop',       // pop | march | shuffle | bossa | chip | sneaky | driving | light | tribal | disco
  swing: 0,           // 선택: 0~0.35
  echo: 0,            // 선택: 0~0.4
}
```

- 멜로디 강박(각 마디 1·3박)에는 해당 코드의 구성음(근음 기준 0·2·4도)을 두면 자연스럽습니다.
- 음량은 렌더링 후 RMS 기준으로 자동 정규화됩니다.

### 상태 관리

```typescript
import { useBgmStore } from '@/hooks/useBgm';

const { playing, trackName, toggle } = useBgmStore();
```

- `playing` — 현재 재생 상태 (boolean)
- `trackName` — 재생 중인 곡 이름 (BGM 버튼 툴팁에 표시)
- `toggle()` — 재생/정지 토글
- `setPlaying(bool)` — 직접 제어

### UI 컴포넌트

`BgmToggle` 컴포넌트가 화면 우상단에 고정 표시되며, 사운드 아이콘으로 ON/OFF를 나타냅니다.

## 브라우저 정책 대응

모든 브라우저는 사용자 인터랙션 없이는 오디오 재생을 차단합니다.

- `AudioContext`는 첫 사용자 클릭/터치 시점에 lazy 생성
- `useBgm`은 첫 인터랙션에서 `AudioContext`를 만들고 곡을 합성·재생 (그 전에는 합성하지 않아 초기 로딩에 영향 없음)
- 모바일 터치는 `touchend`/`click`만 사용자 활성화로 인정되므로, 제스처 리스너(pointerdown/pointerup/touchstart/touchend/click/keydown)를 계속 유지하며 멈춘 `AudioContext`를 `resume()`한다
- 같은 리스너로 iOS의 전화·다른 앱 오디오·음성 인식 등으로 중단된 `AudioContext`도 다음 터치 때 복구
- 탭이 숨겨지면 `suspend()`, 다시 보이면 `resume()` (모바일 배터리 절약)
