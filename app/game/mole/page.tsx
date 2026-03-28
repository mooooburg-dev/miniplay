'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'

const GRID_SIZE = 9
const ROUND_TIME = 15 // 초

type Level = 'easy' | 'normal' | 'hard'
type Phase = 'ready' | 'playing' | 'result'

const LEVEL_CONFIG: Record<Level, {
  label: string
  emoji: string
  showMin: number
  showMax: number
  intervalMin: number
  intervalMax: number
}> = {
  easy: { label: '쉬움', emoji: '🐢', showMin: 1200, showMax: 2000, intervalMin: 800, intervalMax: 1400 },
  normal: { label: '보통', emoji: '🐇', showMin: 800, showMax: 1400, intervalMin: 500, intervalMax: 1000 },
  hard: { label: '어려움', emoji: '🐆', showMin: 500, showMax: 900, intervalMin: 300, intervalMax: 700 },
}

export default function MolePage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playClick, playDanger, playPenalty } = useAudio()

  const [level, setLevel] = useState<Level>('normal')
  const [phase, setPhase] = useState<Phase>('ready')
  const [moles, setMoles] = useState<boolean[]>(Array(GRID_SIZE).fill(false))
  const [whacked, setWhacked] = useState<number | null>(null)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [penaltyPlayer, setPenaltyPlayer] = useState('')
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const moleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedRef = useRef(false)
  const levelRef = useRef(level)
  levelRef.current = level

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (moleTimerRef.current) {
      clearTimeout(moleTimerRef.current)
      moleTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const showRandomMole = useCallback(() => {
    const cfg = LEVEL_CONFIG[levelRef.current]
    const idx = Math.floor(Math.random() * GRID_SIZE)
    setMoles((prev) => {
      const next = [...prev]
      next[idx] = true
      return next
    })

    const showDuration = cfg.showMin + Math.random() * (cfg.showMax - cfg.showMin)
    setTimeout(() => {
      setMoles((prev) => {
        const next = [...prev]
        next[idx] = false
        return next
      })
    }, showDuration)
  }, [])

  const scheduleNextMole = useCallback(() => {
    const cfg = LEVEL_CONFIG[levelRef.current]
    const interval = cfg.intervalMin + Math.random() * (cfg.intervalMax - cfg.intervalMin)
    moleTimerRef.current = setTimeout(() => {
      showRandomMole()
      scheduleNextMole()
    }, interval)
  }, [showRandomMole])

  const startRound = useCallback(() => {
    if (!trackedRef.current) {
      trackEvent('game_start', { game_name: 'mole' })
      trackedRef.current = true
    }

    setPhase('playing')
    setCurrentScore(0)
    setTimeLeft(ROUND_TIME)
    setMoles(Array(GRID_SIZE).fill(false))

    // 타이머 시작
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers()
          setPhase('result')
          setMoles(Array(GRID_SIZE).fill(false))
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 두더지 스폰 시작
    showRandomMole()
    scheduleNextMole()
  }, [clearTimers, showRandomMole, scheduleNextMole])

  const whackMole = useCallback(
    (idx: number) => {
      if (phase !== 'playing' || !moles[idx]) return
      playClick()
      setWhacked(idx)
      setTimeout(() => setWhacked(null), 200)
      setMoles((prev) => {
        const next = [...prev]
        next[idx] = false
        return next
      })
      setCurrentScore((prev) => prev + 1)
    },
    [phase, moles, playClick],
  )

  // 결과 처리: 다음 플레이어로 넘기거나 최종 결과
  const handleResultNext = useCallback(() => {
    const newScores = [...roundScores, currentScore]
    setRoundScores(newScores)

    if (currentPlayerIndex + 1 < players.length) {
      // 다음 플레이어
      setCurrentPlayerIndex((prev) => prev + 1)
      nextTurn()
      setPhase('ready')
    } else {
      // 모든 플레이어 완료 - 최저 점수 플레이어에게 벌칙
      const minScore = Math.min(...newScores)
      const loserIndex = newScores.indexOf(minScore)
      playDanger()
      setTimeout(() => {
        addPenalty(loserIndex)
        setPenaltyPlayer(players[loserIndex])
      }, 800)
    }
  }, [roundScores, currentScore, currentPlayerIndex, players, nextTurn, addPenalty, playDanger])

  const reset = useCallback(() => {
    clearTimers()
    setPhase('ready')
    setMoles(Array(GRID_SIZE).fill(false))
    setCurrentScore(0)
    setTimeLeft(ROUND_TIME)
    setRoundScores([])
    setCurrentPlayerIndex(0)
    setPenaltyPlayer('')
  }, [clearTimers])

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#e74c3c] mb-2">
          🐹 쏙쏙 햄찌
        </h1>
        <TurnBadge playerName={players[currentPlayerIndex]} color="#e74c3c" shadowColor="#f5a5a5" />
        <ScoreBar players={players} scores={scores} currentTurn={currentPlayerIndex} activeColor="#e74c3c" />

        {phase === 'ready' && (
          <div className="flex flex-col items-center gap-4 mt-6">
            <p className="text-lg sm:text-xl font-jua text-[#e74c3c]">
              {players[currentPlayerIndex]}님 준비!
            </p>
            <p className="text-sm sm:text-base text-gray-500 font-jua">
              {ROUND_TIME}초 안에 햄찌를 최대한 많이 잡으세요!
            </p>
            {/* 레벨 선택 */}
            <div className="flex gap-2 sm:gap-3">
              {(Object.keys(LEVEL_CONFIG) as Level[]).map((lv) => {
                const cfg = LEVEL_CONFIG[lv]
                const selected = level === lv
                return (
                  <button
                    key={lv}
                    onClick={() => setLevel(lv)}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-jua text-sm sm:text-base transition-all"
                    style={{
                      background: selected
                        ? 'linear-gradient(180deg, #e74c3c, #c0392b)'
                        : 'white',
                      color: selected ? 'white' : '#888',
                      boxShadow: selected
                        ? '0 3px 0 #962d22, 0 4px 12px rgba(231,76,60,0.25)'
                        : '0 2px 0 #ddd',
                      transform: selected ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                )
              })}
            </div>
            {roundScores.length > 0 && (
              <div className="text-sm text-gray-400 font-jua">
                {roundScores.map((s, i) => (
                  <span key={i} className="mr-3">
                    {players[i]}: {s}마리
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={startRound}
              className="action-btn px-8 py-3 rounded-full text-white text-lg font-jua"
              style={{
                background: 'linear-gradient(180deg, #e74c3c, #c0392b)',
                boxShadow: '0 4px 0 #962d22, 0 6px 16px rgba(231,76,60,0.3)',
              }}
            >
              시작! 🐹
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="flex flex-col items-center gap-3 mt-4">
            {/* 타이머 & 점수 */}
            <div className="flex gap-6 items-center">
              <div
                className="font-jua text-2xl sm:text-3xl"
                style={{ color: timeLeft <= 5 ? '#e74c3c' : '#555' }}
              >
                ⏱ {timeLeft}초
              </div>
              <div className="font-jua text-2xl sm:text-3xl text-[#e74c3c]">
                🎯 {currentScore}마리
              </div>
            </div>

            {/* 두더지 그리드 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-2">
              {moles.map((isUp, idx) => (
                <button
                  key={idx}
                  onClick={() => whackMole(idx)}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden transition-transform active:scale-90"
                  style={{
                    background: 'linear-gradient(180deg, #8B6914, #6B4F10)',
                    boxShadow: whacked === idx
                      ? '0 0 0 3px #e74c3c, 0 2px 8px rgba(231,76,60,0.5)'
                      : '0 4px 0 #4a3509, inset 0 2px 4px rgba(255,255,255,0.15)',
                  }}
                >
                  {/* 구멍 */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[40%] rounded-t-full"
                    style={{ background: 'radial-gradient(ellipse at center, #3d2b0a, #5a4012)' }}
                  />
                  {/* 두더지 */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 transition-all duration-150 text-3xl sm:text-4xl md:text-5xl select-none"
                    style={{
                      bottom: isUp ? '15%' : '-50%',
                      opacity: isUp ? 1 : 0,
                    }}
                  >
                    {whacked === idx ? '💫' : '🐹'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="text-5xl sm:text-6xl animate-land-pop">🎯</div>
            <p className="text-xl sm:text-2xl font-jua text-[#e74c3c]">
              {players[currentPlayerIndex]}님: {currentScore}마리!
            </p>
            <button
              onClick={handleResultNext}
              className="action-btn px-8 py-3 rounded-full text-white text-lg font-jua"
              style={{
                background: 'linear-gradient(180deg, #e74c3c, #c0392b)',
                boxShadow: '0 4px 0 #962d22, 0 6px 16px rgba(231,76,60,0.3)',
              }}
            >
              {currentPlayerIndex + 1 < players.length ? '다음 플레이어 →' : '결과 보기 🏆'}
            </button>
          </div>
        )}

        <p className="mt-4 text-sm sm:text-base text-[#e74c3c]/70 font-jua text-center">
          {phase === 'playing'
            ? '햄찌를 빠르게 터치하세요! 🐹'
            : phase === 'result'
              ? '가장 적게 잡은 사람이 벌칙!'
              : '버튼을 눌러 시작하세요'}
        </p>
      </div>

      <PenaltyOverlay
        isOpen={!!penaltyPlayer}
        loserName={penaltyPlayer}
        onRetry={reset}
      />
    </>
  )
}
