# miniplay

온가족 함께하는 두근두근 벌칙 미니게임 모음 사이트.
부모님이 아이들과 쉽게 접속해서 바로 플레이할 수 있는 것을 최우선으로 합니다.

🌐 **Production**: https://miniplay.kr
📦 **Repo**: https://github.com/mooburg/miniplay

---

## 게임 목록

| 게임 | 경로 | 설명 |
| --- | --- | --- |
| 🎡 숫자 룰렛 | `/game/roulette` | 금지 숫자 / 미션 모드, 돌아가는 룰렛 |
| 👉 화살표 스핀 | `/game/spin` | 화살표가 가리키면 당첨! |
| 🐊 악어 이빨 | `/game/croc` | 12개 이빨 중 함정 하나를 피해라 |
| 🐹 쏙쏙 햄찌 | `/game/mole` | 3x3 두더지잡기, 3단계 난이도 |
| 💣 째깍 폭탄 | `/game/bomb` | 폭탄이 터지기 전에 넘겨라 |
| 🎈 풍선 팡 | `/game/balloon` | 풍선이 터질 때까지 펌프! |

모든 게임은 참여자 없이도 플레이 가능하며, 참여자가 있으면 턴/벌칙 시스템이 자동 활성화됩니다.

---

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v3
- **State**: Zustand v5
- **Font**: Jua (Google Fonts)
- **Audio**: Web Audio API (외부 파일 없이 코드로 합성)
- **PWA**: @ducanh2912/next-pwa + 커스텀 Service Worker
- **Push**: web-push + Redis (구독 저장)
- **Analytics**: Google Analytics 4
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

# ESLint 검사
npm run lint
```

http://localhost:3000 에서 확인할 수 있습니다.

---

## 프로젝트 구조

```
miniplay/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (폰트, GA, PWA 트래킹)
│   ├── globals.css         # Tailwind base + 공통 스타일
│   ├── manifest.ts         # PWA 매니페스트
│   ├── page.tsx            # 홈 허브 (Server Component)
│   ├── api/
│   │   ├── feedback/       # 피드백 → GitHub Issue 자동 생성
│   │   └── push/           # subscribe / unsubscribe / send
│   └── game/
│       ├── roulette/       # 숫자 룰렛
│       ├── spin/           # 화살표 스핀
│       ├── croc/           # 악어 이빨
│       ├── mole/           # 쏙쏙 햄찌
│       ├── bomb/           # 째깍 폭탄
│       └── balloon/        # 풍선 팡
├── components/             # 공용 UI 컴포넌트
├── store/                  # Zustand 전역 상태 (gameStore)
├── hooks/                  # useAudio, useBgm
├── lib/                    # GA, 푸시 클라이언트/서버 유틸
├── worker/                 # Service Worker (푸시 알림)
├── scripts/                # PWA 아이콘 생성 스크립트
├── types/                  # 타입 정의 + GAMES 메타 배열
└── docs/                   # 프로젝트 문서
```

---

## 문서

자세한 개발 가이드는 [docs/](docs/) 폴더를 참고하세요.

- [아키텍처 개요](docs/architecture.md)
- [새 게임 추가 가이드](docs/add-game.md)
- [사운드 시스템](docs/sound-system.md)
- [푸시 알림](docs/push-notifications.md)

---

## 향후 계획

- 카카오 로그인 (NextAuth.js)
- 플레이어 이름 저장 (Supabase)
- 게임 방 코드 기능 (Jackbox 스타일)
- 새 게임 추가: 제기차기, 눈치게임 등
