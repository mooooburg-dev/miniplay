'use client'
import { useRouter } from 'next/navigation'
import type { GameMeta } from '@/types'
import { useGameStore } from '@/store/gameStore'

interface GameCardProps {
  game: GameMeta
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter()
  const { players, setCurrentGame, resetTurn } = useGameStore()
  const disabled = players.length < 2

  const handleClick = () => {
    if (disabled) return
    setCurrentGame(game.id)
    resetTurn()
    router.push(game.path)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`bg-white rounded-3xl p-5 text-center transition-all duration-150 font-jua w-full ${disabled ? 'opacity-40 saturate-0' : 'active:translate-y-1 hover:-translate-y-0.5'}`}
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
