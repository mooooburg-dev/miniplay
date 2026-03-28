'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'

const TOOTH_COUNT = 12

type ToothState = 'idle' | 'pulled' | 'danger'

function initTeeth(trapIndex: number): ToothState[] {
  return Array(TOOTH_COUNT).fill('idle') as ToothState[]
}

export default function CrocPage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playSafe, playDanger } = useAudio()

  const [trapIndex, setTrapIndex] = useState(() => Math.floor(Math.random() * TOOTH_COUNT))
  const [teeth, setTeeth] = useState<ToothState[]>(() => initTeeth(trapIndex))
  const [hint, setHint] = useState('조심조심... 이빨을 뽑아보세요! 🦷')
  const [penaltyPlayer, setPenaltyPlayer] = useState('')
  const [locked, setLocked] = useState(false)
  const trackedRef = useRef(false)

  const pullTooth = useCallback(
    (i: number) => {
      if (locked || teeth[i] !== 'idle') return
      if (!trackedRef.current) {
        trackEvent('game_start', { game_name: 'croc' })
        trackedRef.current = true
      }

      if (i === trapIndex) {
        // 위험!
        setTeeth((prev) => prev.map((t, idx) => (idx === i ? 'danger' : t)))
        setLocked(true)
        setHint('앗! 물렸다! 😱 악어가 깨물었어요!')
        playDanger()
        setTimeout(() => {
          addPenalty(turn)
          setPenaltyPlayer(players[turn])
        }, 1200)
      } else {
        // 안전
        setTeeth((prev) => prev.map((t, idx) => (idx === i ? 'pulled' : t)))
        playSafe()
        const next = (turn + 1) % players.length
        const safeLeft = teeth.filter((t, idx) => t === 'idle' && idx !== trapIndex).length - 1
        if (safeLeft === 0) {
          setHint('마지막 이빨이 남았어요... 🫣')
        } else {
          setHint(`휴~ 안전! 다음은 ${players[next]} 차례 🌿`)
        }
        nextTurn()
      }
    },
    [locked, teeth, trapIndex, turn, players, playSafe, playDanger, nextTurn, addPenalty],
  )

  const reset = useCallback(() => {
    setTrapIndex(Math.floor(Math.random() * TOOTH_COUNT))
    setTeeth(Array(TOOTH_COUNT).fill('idle') as ToothState[])
    setHint('조심조심... 이빨을 뽑아보세요! 🦷')
    setPenaltyPlayer('')
    setLocked(false)
  }, [])

  const topTeeth = teeth.slice(0, 6)
  const botTeeth = teeth.slice(6, 12)

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#27ae60] mb-2">🐊 악어 이빨 뽑기</h1>
        <TurnBadge playerName={players[turn]} color="#27ae60" shadowColor="#a8e6cf" />
        <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor="#27ae60" />

        {/* 악어 입 */}
        <div
          className="rounded-[28px_28px_55px_55px] sm:rounded-[36px_36px_65px_65px] px-4 pt-4 pb-7 sm:px-6 sm:pt-6 sm:pb-9 md:px-8 md:pt-8 md:pb-11 w-full max-w-[350px] sm:max-w-[480px] md:max-w-[560px]"
          style={{
            background: 'linear-gradient(180deg, #2ecc71, #27ae60)',
            boxShadow: '0 8px 0 #1e8449, 0 12px 24px rgba(46,204,113,0.3)',
          }}
        >
          {/* 눈 */}
          <div className="flex justify-around mb-3">
            {['', ''].map((_, i) => (
              <div
                key={i}
                className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f1c40f] rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl animate-eye-blink"
                style={{
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  animationDelay: i === 1 ? '0.4s' : '0s',
                }}
              >
                👁️
              </div>
            ))}
          </div>

          {/* 이빨 위 줄 */}
          <div className="flex gap-1.5 sm:gap-2.5 md:gap-3 justify-center mb-1.5 sm:mb-2.5">
            {topTeeth.map((state, i) => (
              <ToothButton key={i} state={state} onClick={() => pullTooth(i)} />
            ))}
          </div>
          {/* 이빨 아래 줄 */}
          <div className="flex gap-1.5 sm:gap-2.5 md:gap-3 justify-center">
            {botTeeth.map((state, i) => (
              <ToothButton key={i + 6} state={state} onClick={() => pullTooth(i + 6)} />
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-[#27ae60] font-jua text-center">{hint}</p>
      </div>

      <PenaltyOverlay
        isOpen={!!penaltyPlayer}
        loserName={penaltyPlayer}
        onRetry={reset}
      />
    </>
  )
}

function ToothButton({ state, onClick }: { state: ToothState; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={state !== 'idle'}
      className={`
        w-11 h-16 sm:w-16 sm:h-20 md:w-[4.5rem] md:h-24 border-none rounded-b-[22px] sm:rounded-b-[28px] relative transition-all duration-150
        ${state === 'idle'
          ? 'bg-white cursor-pointer hover:-translate-y-1 active:translate-y-1'
          : ''}
        ${state === 'pulled' ? 'tooth-pulled' : ''}
        ${state === 'danger' ? 'tooth-danger' : ''}
      `}
      style={
        state === 'idle'
          ? { boxShadow: '0 4px 0 #ccc, inset 0 3px 5px rgba(255,255,255,0.6)' }
          : undefined
      }
    >
      {state === 'danger' && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-lg sm:text-xl md:text-2xl">💀</span>
      )}
      {state === 'idle' && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-lg sm:text-xl md:text-2xl opacity-15">🦷</span>
      )}
    </button>
  )
}
