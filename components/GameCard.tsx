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
      className={`glass-card p-5 sm:p-6 md:p-7 text-center transition-all duration-300 font-jua w-full group overflow-hidden relative ${
        disabled
          ? 'opacity-50 saturate-0'
          : 'hover:-translate-y-1 hover:shadow-xl active:scale-95'
      }`}
      style={{
        boxShadow: disabled
          ? 'none'
          : `0 8px 20px ${game.color}30, inset 0 2px 4px rgba(255,255,255,0.7)`,
        borderBottom: `4px solid ${game.color}20`,
      }}
    >
      {/* Decorative gradient blob inside card */}
      <div
        className="absolute -inset-6 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-2xl rounded-full z-0"
        style={{ background: `radial-gradient(circle, ${game.color}, transparent 70%)` }}
      />
      <span className="text-6xl sm:text-7xl md:text-8xl block mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:drop-shadow-sm">
        {game.emoji}
      </span>
      <span className="block text-lg sm:text-xl md:text-2xl mb-0.5 relative z-10 font-bold" style={{ color: game.color }}>
        {game.name}
      </span>
      <span className="block text-[11px] sm:text-xs md:text-sm text-gray-400 relative z-10">{game.desc}</span>
    </button>
  )
}
