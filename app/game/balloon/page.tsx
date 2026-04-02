'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'

const POP_MIN = 8
const POP_MAX = 21

export default function BalloonPage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playPump, playPop } = useAudio()

  const [popAt, setPopAt] = useState(() => POP_MIN + Math.floor(Math.random() * (POP_MAX - POP_MIN + 1)))
  const [pumps, setPumps] = useState(0)
  const [popped, setPopped] = useState(false)
  const [penaltyPlayer, setPenaltyPlayer] = useState('')

  const ratio = popped ? 1 : pumps / popAt
  const balloonSize = 5 + ratio * 9   // 5rem → 14rem (sm/md에서는 CSS scale로 추가 확대)
  const isWarning = ratio >= 0.6
  const isDanger = ratio >= 0.85

  let dangerColor = '#c9b8ff'
  if (ratio >= 0.75) dangerColor = '#e74c3c'
  else if (ratio >= 0.5) dangerColor = '#f1c40f'

  let msgText = '버튼을 눌러 풍선을 부풀려요!'
  if (isDanger) msgText = '⚠️ 위험해요! 이제 곧 터질 것 같아요!!'
  else if (isWarning) msgText = '😬 조심조심... 점점 커지고 있어요!'
  else if (pumps > 0) msgText = '💨 더 부풀려봐요!'

  const trackedRef = useRef(false)

  const pump = useCallback(() => {
    if (popped) return
    if (!trackedRef.current) {
      trackEvent('game_start', { game_name: 'balloon' })
      trackedRef.current = true
    }
    const next = pumps + 1
    setPumps(next)
    playPump()

    if (next >= popAt) {
      // 펑!
      setPopped(true)
      playPop()
      setTimeout(() => {
        if (players.length > 0) {
          addPenalty(turn)
          setPenaltyPlayer(players[turn])
        } else {
          setPenaltyPlayer('💥')
        }
      }, 1000)
    } else {
      if (players.length > 0) nextTurn()
    }
  }, [popped, pumps, popAt, turn, players, playPump, playPop, nextTurn, addPenalty])

  const reset = useCallback(() => {
    setPopAt(POP_MIN + Math.floor(Math.random() * (POP_MAX - POP_MIN + 1)))
    setPumps(0)
    setPopped(false)
    setPenaltyPlayer('')
  }, [])

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#7b61ff] mb-2">🎈 풍선 팡</h1>
        {players.length > 0 && (
          <>
            <TurnBadge playerName={players[turn]} color="#7b61ff" shadowColor="#c9b8ff" />
            <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor="#7b61ff" />
          </>
        )}

        {/* 풍선 스테이지 */}
        <div className="relative h-[270px] sm:h-[380px] md:h-[440px] flex items-center justify-center w-full mb-2">
          <span
            className={`select-none block transition-[font-size] duration-[250ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
              ${isDanger && !popped ? 'animate-balloon-shake' : ''}
              ${popped ? 'animate-boom-pop' : ''}
            `}
            style={{
              fontSize: `${balloonSize}rem`,
              filter: popped
                ? 'none'
                : `drop-shadow(0 8px 16px rgba(123,97,255,${0.2 + ratio * 0.4}))`,
            }}
          >
            {popped ? '💥' : '🎈'}
          </span>

          {/* 펌프 카운터 */}
          <div className="absolute bottom-1.5 bg-white/85 rounded-full px-5 py-1 sm:px-6 sm:py-1.5 text-sm sm:text-base font-jua text-[#7b61ff]">
            {pumps}번 펌프
          </div>
        </div>

        {/* 위험도 바 */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md h-3 sm:h-4 bg-white/50 rounded-lg overflow-hidden mb-2">
          <div
            className="h-full rounded-lg transition-[width,background] duration-[250ms]"
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              background: dangerColor,
            }}
          />
        </div>

        {/* 메시지 */}
        <p className="text-sm sm:text-base md:text-lg font-jua text-[#7b61ff] min-h-[1.4rem] text-center mb-4">{msgText}</p>

        {/* 버튼 */}
        <button
          onClick={pump}
          disabled={popped}
          className="text-3xl sm:text-4xl md:text-5xl font-jua text-white px-12 py-4 sm:px-14 sm:py-5 rounded-full disabled:opacity-50 active:translate-y-1.5 transition-transform"
          style={{
            background: 'linear-gradient(145deg, #7b61ff, #9b85ff)',
            boxShadow: '0 8px 0 #5a47cc',
          }}
        >
          💨 팡팡!
        </button>
      </div>

      <PenaltyOverlay
        isOpen={!!penaltyPlayer}
        loserName={penaltyPlayer}
        onRetry={reset}
      />
    </>
  )
}
