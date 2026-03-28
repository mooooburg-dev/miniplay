# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 합니다.

🌐 **Production**: https://miniplay.kr

---

## 게임 목록

| 게임 | 경로 | 설명 |
| --- | --- | --- |
| 🎰 숫자 룰렛 | `/game/roulette` | 돌아가는 룰렛, 누가 걸릴까? |
| 🐊 악어 이빨 | `/game/croc` | 이빨을 하나씩 눌러라! |
| 💣 째깍 폭탄 | `/game/bomb` | 폭탄이 터지기 전에! |
| 🎈 풍선 팡 | `/game/balloon` | 풍선이 터질 때까지 펌프! |

---

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v3
- **State**: Zustand v5
- **Font**: Jua (Google Fonts)
- **Audio**: Web Audio API
- **Deploy**: Vercel

---

## 시작하기

```bash
# 의존성 설치
yarn install

# 로컬 개발 서버
yarn dev

# 프로덕션 빌드
yarn build
```

http://localhost:3000 에서 확인할 수 있습니다.

---

## 프로젝트 구조

```
miniplay/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Jua 폰트, 메타데이터)
│   ├── globals.css         # Tailwind base + 공통 스타일
│   ├── page.tsx            # 홈 허브 (게임 카드 목록)
│   └── game/
│       ├── roulette/page.tsx
│       ├── croc/page.tsx
│       ├── bomb/page.tsx
│       └── balloon/page.tsx
├── components/
│   ├── GameCard.tsx        # 게임 선택 카드
│   ├── PlayerSetup.tsx     # 플레이어 이름 설정
│   ├── TurnBadge.tsx       # 현재 차례 표시
│   ├── ScoreBar.tsx        # 플레이어별 점수
│   └── PenaltyOverlay.tsx  # 벌칙 오버레이
├── store/
│   └── gameStore.ts        # Zustand 전역 상태
├── hooks/
│   └── useAudio.ts         # Web Audio API 사운드 엔진
└── types/
    └── index.ts            # 타입 정의 + GAMES 메타 배열
```

---

## 향후 계획

- 카카오 로그인 (NextAuth.js)
- 플레이어 이름 저장 (Supabase)
- 게임 방 코드 기능 (Jackbox 스타일)
- 새 게임 추가: 제기차기, 눈치게임 등
