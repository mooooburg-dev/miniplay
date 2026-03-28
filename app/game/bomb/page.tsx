'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'

const BOMB_MIN = 9000
const BOMB_MAX = 25000

type Phase = 'idle' | 'ticking' | 'exploded'

export default function BombPage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playClick, playBombTick, playExplosion } = useAudio()

  const [phase, setPhase] = useState<Phase>('idle')
  const [fusePercent, setFusePercent] = useState(100)
  const [penaltyPlayer, setPenaltyPlayer] = useState('')
  const [shaking, setShaking] = useState(false)

  const fuseRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const explodeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalRef = useRef(0)
  const expireRef = useRef(0)

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearAll()
  }, [])

  const clearAll = () => {
    if (fuseRef.current)   clearInterval(fuseRef.current)
    if (tickRef.current)   clearInterval(tickRef.current)
    if (explodeRef.current) clearTimeout(explodeRef.current)
  }

  const startBomb = useCallback(() => {
    if (phase !== 'idle') return
    trackEvent('game_start', { game_name: 'bomb' })
    playClick()

    const total = BOMB_MIN + Math.random() * (BOMB_MAX - BOMB_MIN)
    totalRef.current = total
    expireRef.current = Date.now() + total

    setPhase('ticking')

    // 퓨즈 바 업데이트 (100ms)
    fuseRef.current = setInterval(() => {
      const remaining = expireRef.current - Date.now()
      if (remaining <= 0) {
        setFusePercent(0)
        return
      }
      setFusePercent((remaining / totalRef.current) * 100)
    }, 100)

    // 틱 사운드 (600ms)
    tickRef.current = setInterval(() => {
      playBombTick()
    }, 600)

    // 폭발
    explodeRef.current = setTimeout(() => {
      clearAll()
      setPhase('exploded')
      setFusePercent(0)
      playExplosion()
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setTimeout(() => {
        addPenalty(useGameStore.getState().turn)
        setPenaltyPlayer(useGameStore.getState().players[useGameStore.getState().turn])
      }, 900)
    }, total)
  }, [phase, playClick, playBombTick, playExplosion, addPenalty])

  const passBomb = useCallback(() => {
    if (phase !== 'ticking') return
    playClick()
    nextTurn()
  }, [phase, playClick, nextTurn])

  const reset = useCallback(() => {
    clearAll()
    setPhase('idle')
    setFusePercent(100)
    setPenaltyPlayer('')
    setShaking(false)
  }, [])

  const fuseColor = `linear-gradient(90deg, rgb(243,${Math.round(Math.max(0, 156 * (fusePercent / 100)))},18), #e74c3c)`

  return (
    <>
      <div className={`game-screen ${shaking ? 'animate-screen-shake' : ''}`}>
        <button
          onClick={() => { clearAll(); router.push('/') }}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#e67e22] mb-2">💣 째깍째깍 폭탄</h1>
        <TurnBadge playerName={players[turn]} color="#e67e22" shadowColor="#ffd6a5" />
        <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor="#e67e22" />

        {/* 폭탄 이모지 */}
        <div
          className={`text-[8.5rem] sm:text-[12rem] md:text-[14rem] mb-5 select-none filter
            ${phase === 'idle'     ? 'animate-bomb-idle' : ''}
            ${phase === 'ticking'  ? 'animate-bomb-tick' : ''}
            ${phase === 'exploded' ? 'animate-boom-pop'  : ''}
          `}
          style={{ filter: 'drop-shadow(0 8px 16px rgba(230,126,34,0.4))' }}
        >
          {phase === 'exploded' ? '💥' : '💣'}
        </div>

        {/* 현재 보유자 */}
        <div
          className="bg-white rounded-2xl sm:rounded-3xl px-9 py-3.5 sm:px-12 sm:py-5 text-center min-w-[200px] sm:min-w-[260px] mb-4"
          style={{ boxShadow: '0 6px 0 #ffd6a5' }}
        >
          <p className="text-xs sm:text-sm text-gray-300 font-jua mb-1">🤲 지금 들고 있는 사람</p>
          <p className="text-3xl sm:text-4xl md:text-5xl text-[#e67e22] font-jua">{players[turn]}</p>
        </div>

        {/* 퓨즈 바 */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md h-3.5 sm:h-4 bg-white/50 rounded-lg overflow-hidden mb-5">
          <div
            className="h-full rounded-lg transition-[width] duration-[120ms] linear"
            style={{ width: `${fusePercent}%`, background: fuseColor }}
          />
        </div>

        {/* 버튼 */}
        {phase === 'idle' && (
          <button
            onClick={startBomb}
            className="relative px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn active:translate-y-1.5 transition-transform"
            style={{
              background: 'linear-gradient(145deg, #e67e22, #f39c12)',
              boxShadow: '0 8px 0 #b15a0d',
            }}
          >
            🔥 시작!
          </button>
        )}
        {phase === 'ticking' && (
          <button
            onClick={passBomb}
            className="relative px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn active:translate-y-1.5 transition-transform"
            style={{
              background: 'linear-gradient(145deg, #e74c3c, #ff6b6b)',
              boxShadow: '0 8px 0 #c0392b',
            }}
          >
            💨 전달하기!
          </button>
        )}
      </div>

      <PenaltyOverlay
        isOpen={!!penaltyPlayer}
        loserName={penaltyPlayer}
        onRetry={reset}
      />
    </>
  )
}
