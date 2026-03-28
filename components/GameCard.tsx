'use client'
import { useRouter } from 'next/navigation'
import type { GameMeta } from '@/types'
import { useGameStore } from '@/store/gameStore'

interface GameCardProps {
  game: GameMeta
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter()
  const { setCurrentGame, resetTurn } = useGameStore()

  const handleClick = () => {
    setCurrentGame(game.id)
    resetTurn()
    router.push(game.path)
  }

  return (
    <button
      onClick={handleClick}
      className="bg-white rounded-3xl p-5 text-center transition-all duration-150 active:translate-y-1 hover:-translate-y-0.5 font-jua w-full"
      style={{ boxShadow: `0 6px 0 ${game.shadow}` }}
    >
      <span className="text-5xl block mb-2">{game.emoji}</span>
      <span className="block text-base mb-1" style={{ color: game.color }}>
        {game.name}
      </span>
      <span className="block text-xs text-gray-400">{game.desc}</span>
    </button>
  )
}
