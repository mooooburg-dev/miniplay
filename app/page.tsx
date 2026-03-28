import { GameCard } from '@/components/GameCard'
import { PlayerSetup } from '@/components/PlayerSetup'
import { GAMES } from '@/types'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 pt-6 pb-12">
      {/* 타이틀 */}
      <h1 className="text-4xl text-[#ff6b9d] font-jua text-center mt-2 mb-1 animate-float-y [text-shadow:3px_3px_0_#ffb3cc]">
        🎮 미니게임 모음
      </h1>
      <p className="text-sm text-[#ff8fab] font-jua text-center mb-5">
        온가족 함께하는 두근두근 벌칙 게임 💕
      </p>

      {/* 플레이어 설정 */}
      <PlayerSetup />

      {/* 게임 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3.5 w-full max-w-sm">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </main>
  )
}
