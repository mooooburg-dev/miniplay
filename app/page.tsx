import { GameCard } from '@/components/GameCard'
import { PlayerSetup } from '@/components/PlayerSetup'
import { FeedbackButton } from '@/components/FeedbackButton'
import { GAMES } from '@/types'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12">
      {/* 타이틀 영역 */}
      <div className="flex flex-col items-center mb-8 w-full max-w-sm">
        <h1 className="text-4xl text-[#ff6b9d] font-jua text-center mb-2 animate-float-y select-none relative">
          <span className="absolute -inset-1 blur-md bg-white/40 rounded-full z-0"></span>
          <span className="relative z-10 [text-shadow:0_2px_10px_rgba(255,179,204,0.6)]">🎮 미니게임 모음</span>
        </h1>
        <p className="text-sm text-[#ff8fab] font-jua text-center bg-white/40 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
          온가족 함께하는 두근두근 벌칙 게임 💕
        </p>
      </div>

      {/* 플레이어 설정 */}
      <PlayerSetup />

      {/* 게임 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-2">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {/* 의견함 플로팅 버튼 */}
      <FeedbackButton />
    </main>
  )
}
