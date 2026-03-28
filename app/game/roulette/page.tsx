'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { TurnBadge } from '@/components/TurnBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { PenaltyOverlay } from '@/components/PenaltyOverlay'
import { trackEvent } from '@/lib/gtag'

const SPIN_DURATION = 3000
const COLORS = [
  '#ff6b9d', '#e67e22', '#f1c40f', '#27ae60',
  '#3498db', '#7b61ff', '#e74c3c', '#1abc9c',
]

type Phase = 'idle' | 'spinning' | 'done'

export default function RoulettePage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playClick, playTick, playBeep, playFanfare, playDanger } = useAudio()

  const [phase, setPhase] = useState<Phase>('idle')
  const [displayNum, setDisplayNum] = useState<number | null>(null)
  const [numColor, setNumColor] = useState(COLORS[0])
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState('버튼을 눌러봐! 🌟')
  const [forbiddenNum] = useState(() => Math.floor(Math.random() * 8))
  const [penaltyPlayer, setPenaltyPlayer] = useState('')
  const [landedAnim, setLandedAnim] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spin = useCallback(() => {
    if (phase !== 'idle') return
    trackEvent('game_start', { game_name: 'roulette' })
    setPhase('spinning')
    setLandedAnim(false)
    setProgress(0)
    setMsg('두근두근... 🥁')
    playClick()

    const final = Math.floor(Math.random() * 8)
    const t0 = Date.now()

    const tick = () => {
      const elapsed = Date.now() - t0
      const p = Math.min(elapsed / SPIN_DURATION, 1)
      setProgress(p * 100)

      if (p < 0.95) {
        const n = Math.floor(Math.random() * 8)
        setDisplayNum(n)
        setNumColor(COLORS[n])
        if (p < 0.7) playTick(1.5 - p * 0.8)
        else playBeep(880 - p * 310)
        const speed = 80 + p * p * 330
        timeoutRef.current = setTimeout(tick, speed)
      } else {
        // 착지
        setDisplayNum(final)
        setNumColor(COLORS[final])
        setProgress(0)
        setLandedAnim(true)

        const isLose = final === forbiddenNum
        if (isLose) {
          setMsg(`💀 금지 숫자 ${forbiddenNum}! ${players[turn]} 벌칙!`)
          playDanger()
          setTimeout(() => {
            addPenalty(turn)
            setPenaltyPlayer(players[turn])
          }, 1000)
        } else {
          setMsg(`${final}번! 안전~ 😊`)
          playFanfare()
          setTimeout(() => {
            setPhase('idle')
            setLandedAnim(false)
            setMsg('버튼을 눌러봐! 🌟')
            nextTurn()
          }, 1600)
        }
      }
    }
    tick()
  }, [
    phase, turn, players, forbiddenNum,
    playClick, playTick, playBeep, playFanfare, playDanger,
    nextTurn, addPenalty,
  ])

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPhase('idle')
    setDisplayNum(null)
    setProgress(0)
    setMsg('버튼을 눌러봐! 🌟')
    setPenaltyPlayer('')
    setLandedAnim(false)
  }, [])

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); router.push('/') }}
          className="self-start bg-white/75 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua mb-2 active:scale-95 transition-transform"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#ff6b9d] mb-2">🎡 숫자 룰렛</h1>

        <TurnBadge playerName={players[turn]} color="#ff6b9d" shadowColor="#ffb3cc" />
        <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor="#ff6b9d" />

        {/* 금지 숫자 */}
        <div className="bg-white/80 rounded-full px-5 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base md:text-lg text-[#e74c3c] font-jua mb-4 border-2 border-dashed border-[#ff8fab]">
          🚫 금지 숫자: {forbiddenNum}
        </div>

        {/* 숫자 디스플레이 */}
        <div
          className={`w-52 h-52 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-white rounded-[38px] sm:rounded-[48px] flex items-center justify-center mb-2 relative overflow-hidden
            ${phase === 'spinning' ? 'animate-spin-bounce' : ''}
            ${landedAnim ? 'animate-land-pop' : ''}`}
          style={{ boxShadow: '0 10px 0 #ffb3cc, 0 14px 28px rgba(255,107,157,0.25)' }}
        >
          {/* 광택 */}
          <div className="absolute top-2.5 left-2.5 w-9 h-9 sm:w-12 sm:h-12 bg-white/70 rounded-full" />
          <div className="absolute top-3.5 left-[52px] sm:top-5 sm:left-[72px] w-[18px] h-[18px] sm:w-6 sm:h-6 bg-white/50 rounded-full" />
          <span
            className="text-[8.5rem] sm:text-[11rem] md:text-[12rem] leading-none select-none font-jua"
            style={{ color: numColor, textShadow: `4px 4px 0 ${numColor}88` }}
          >
            {displayNum ?? '?'}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div
          className={`w-52 sm:w-72 md:w-80 h-3 sm:h-4 bg-white/50 rounded-lg overflow-hidden mb-2 transition-opacity duration-300 ${phase === 'spinning' ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className="h-full rounded-lg transition-[width] duration-[100ms] linear"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff6b9d, #ffb347)' }}
          />
        </div>

        {/* 메시지 */}
        <p className="text-base sm:text-lg md:text-xl text-[#ff6b9d] font-jua text-center min-h-[1.6rem] mb-4">{msg}</p>

        {/* 버튼 */}
        <button
          onClick={spin}
          disabled={phase !== 'idle'}
          className="relative px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn disabled:opacity-50 active:translate-y-1 transition-transform"
          style={{
            background: 'linear-gradient(145deg, #ff6b9d, #ff8fab)',
            boxShadow: '0 8px 0 #d63384',
          }}
        >
          🎲 {phase === 'idle' ? '돌려돌려!' : '두근두근...'}
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
