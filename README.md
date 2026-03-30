# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 합니다.

🌐 **Production**: https://miniplay.kr

---

## 게임 목록

| 게임 | 경로 | 설명 |
| --- | --- | --- |
| 🎡 숫자 룰렛 | `/game/roulette` | 돌아가는 룰렛, 누가 걸릴까? |
| 👉 화살표 스핀 | `/game/spin` | 화살표가 가리키면 당첨! |
| 🐊 악어 이빨 | `/game/croc` | 이빨을 하나씩 눌러라! |
| 🐹 쏙쏙 햄찌 | `/game/mole` | 쏙쏙 올라오는 햄찌를 잡아라! |
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
npm install

# 로컬 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
```

http://localhost:3000 에서 확인할 수 있습니다.

---

## 프로젝트 구조

```
miniplay/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── globals.css         # Tailwind base + 공통 스타일
│   ├── manifest.ts         # PWA 매니페스트
│   ├── page.tsx            # 홈 허브
│   ├── api/feedback/       # 피드백 API
│   └── game/
│       ├── roulette/       # 숫자 룰렛
│       ├── spin/           # 화살표 스핀
│       ├── croc/           # 악어 이빨
│       ├── mole/           # 쏙쏙 햄찌
│       ├── bomb/           # 째깍 폭탄
│       └── balloon/        # 풍선 팡
├── components/             # 공용 UI 컴포넌트
├── store/                  # Zustand 전역 상태
├── hooks/                  # 커스텀 훅 (useAudio, useBgm)
├── lib/                    # 유틸리티 (Google Analytics)
└── types/                  # 타입 정의 + GAMES 메타 배열
```

---

## 향후 계획

- 카카오 로그인 (NextAuth.js)
- 플레이어 이름 저장 (Supabase)
- 게임 방 코드 기능 (Jackbox 스타일)
- 새 게임 추가: 제기차기, 눈치게임 등
