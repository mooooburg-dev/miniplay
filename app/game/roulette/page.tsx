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
type RouletteMode = 'forbidden' | 'mission'

export default function RoulettePage() {
  const router = useRouter()
  const { players, scores, turn, nextTurn, addPenalty } = useGameStore()
  const { playClick, playTick, playBeep, playFanfare, playDanger } = useAudio()

  const [mode, setMode] = useState<RouletteMode | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayNum, setDisplayNum] = useState<number | null>(null)
  const [numColor, setNumColor] = useState(COLORS[0])
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState('버튼을 눌러봐! 🌟')
  const [forbiddenNum, setForbiddenNum] = useState(() => Math.floor(Math.random() * 8))
  const [penaltyPlayer, setPenaltyPlayer] = useState('')
  const [landedAnim, setLandedAnim] = useState(false)

  // 미션 모드 상태
  const [maxNum, setMaxNum] = useState(10)
  const [missionResult, setMissionResult] = useState('')

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spin = useCallback(() => {
    if (phase !== 'idle') return
    trackEvent('game_start', { game_name: 'roulette', mode: mode ?? 'forbidden' })
    setPhase('spinning')
    setLandedAnim(false)
    setProgress(0)
    setMsg('두근두근... 🥁')
    setMissionResult('')
    playClick()

    const range = mode === 'mission' ? maxNum : 8
    const final = Math.floor(Math.random() * range) + (mode === 'mission' ? 1 : 0)
    const t0 = Date.now()

    const tick = () => {
      const elapsed = Date.now() - t0
      const p = Math.min(elapsed / SPIN_DURATION, 1)
      setProgress(p * 100)

      if (p < 0.95) {
        const n = mode === 'mission'
          ? Math.floor(Math.random() * range) + 1
          : Math.floor(Math.random() * 8)
        setDisplayNum(n)
        setNumColor(COLORS[n % COLORS.length])
        if (p < 0.7) playTick(1.5 - p * 0.8)
        else playBeep(880 - p * 310)
        const speed = 80 + p * p * 330
        timeoutRef.current = setTimeout(tick, speed)
      } else {
        // 착지
        setDisplayNum(final)
        setNumColor(COLORS[final % COLORS.length])
        setProgress(0)
        setLandedAnim(true)

        if (mode === 'forbidden') {
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
        } else {
          // 미션 모드
          const resultText = `${players[turn]}! ${final}번 미션하기! 🎉`
          setMsg(resultText)
          setMissionResult(resultText)
          playFanfare()
          setTimeout(() => {
            setPhase('idle')
            setLandedAnim(false)
            setMsg('버튼을 눌러봐! 🌟')
            nextTurn()
          }, 3000)
        }
      }
    }
    tick()
  }, [
    phase, mode, turn, players, forbiddenNum, maxNum,
    playClick, playTick, playBeep, playFanfare, playDanger,
    nextTurn, addPenalty,
  ])

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setForbiddenNum(Math.floor(Math.random() * 8))
    setPhase('idle')
    setDisplayNum(null)
    setProgress(0)
    setMsg('버튼을 눌러봐! 🌟')
    setPenaltyPlayer('')
    setLandedAnim(false)
    setMissionResult('')
  }, [])

  // 모드 선택 화면
  if (mode === null) {
    return (
      <div className="game-screen">
        <button
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#ff6b9d] mb-6">🎡 숫자 룰렛</h1>

        <p className="text-lg sm:text-xl text-gray-500 font-jua mb-8">어떤 모드로 플레이할까요?</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => { playClick(); setMode('mission') }}
            className="relative px-8 py-5 text-xl sm:text-2xl font-jua text-white rounded-3xl action-btn active:translate-y-1 transition-transform"
            style={{
              background: 'linear-gradient(145deg, #3498db, #5dade2)',
              boxShadow: '0 8px 0 #2471a3, 0 12px 24px rgba(52,152,219,0.25)',
            }}
          >
            🎯 숫자 미션
            <span className="block text-sm mt-1 opacity-80">나온 숫자만큼 미션 수행!</span>
          </button>

          <button
            onClick={() => { playClick(); setMode('forbidden') }}
            className="relative px-8 py-5 text-xl sm:text-2xl font-jua text-white rounded-3xl action-btn active:translate-y-1 transition-transform"
            style={{
              background: 'linear-gradient(145deg, #e74c3c, #ff6b6b)',
              boxShadow: '0 8px 0 #c0392b, 0 12px 24px rgba(231,76,60,0.25)',
            }}
          >
            🚫 금지 숫자
            <span className="block text-sm mt-1 opacity-80">금지 숫자에 걸리면 벌칙!</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="game-screen">
        <button
          onClick={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); router.push('/') }}
          className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          ← 홈으로
        </button>

        {/* 모드 변경 버튼 */}
        <button
          onClick={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setMode(null)
            reset()
          }}
          className="fixed top-4 right-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
        >
          🔄 모드 변경
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#ff6b9d] mb-2">
          🎡 숫자 룰렛
        </h1>

        <TurnBadge playerName={players[turn]} color="#ff6b9d" shadowColor="#ffb3cc" />
        <ScoreBar players={players} scores={scores} currentTurn={turn} activeColor="#ff6b9d" />

        {mode === 'forbidden' ? (
          /* 금지 숫자 모드 */
          <div className="bg-white/80 rounded-full px-5 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base md:text-lg text-[#e74c3c] font-jua mb-4 border-2 border-dashed border-[#ff8fab]">
            🚫 금지 숫자: {forbiddenNum}
          </div>
        ) : (
          /* 미션 모드 설정 */
          <div className="bg-white/80 rounded-full px-5 py-1.5 sm:px-6 sm:py-2 font-jua mb-4 border-2 border-dashed border-[#5dade2] flex items-center gap-2">
            <span className="text-sm sm:text-base text-[#3498db] whitespace-nowrap">🎯 1~{maxNum}번 미션하기</span>
            <input
              type="range"
              min={2}
              max={20}
              value={maxNum}
              onChange={(e) => setMaxNum(Number(e.target.value))}
              className="w-20 sm:w-24 accent-[#3498db]"
            />
          </div>
        )}

        {/* 숫자 디스플레이 */}
        <div
          className={`w-52 h-52 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-white rounded-[38px] sm:rounded-[48px] flex items-center justify-center mb-2 relative overflow-hidden
            ${phase === 'spinning' ? 'animate-spin-bounce' : ''}
            ${landedAnim ? 'animate-land-pop' : ''}`}
          style={{ boxShadow: mode === 'forbidden'
            ? '0 10px 0 #ffb3cc, 0 14px 28px rgba(255,107,157,0.25)'
            : '0 10px 0 #85c1e9, 0 14px 28px rgba(52,152,219,0.25)'
          }}
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
            style={{ width: `${progress}%`, background: mode === 'forbidden'
              ? 'linear-gradient(90deg, #ff6b9d, #ffb347)'
              : 'linear-gradient(90deg, #3498db, #5dade2)'
            }}
          />
        </div>

        {/* 메시지 */}
        <p className={`text-base sm:text-lg md:text-xl font-jua text-center min-h-[1.6rem] mb-4 max-w-sm ${
          mode === 'forbidden' ? 'text-[#ff6b9d]' : 'text-[#3498db]'
        }`}>
          {missionResult || msg}
        </p>

        {/* 버튼 */}
        <button
          onClick={spin}
          disabled={phase !== 'idle'}
          className="relative px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn disabled:opacity-50 active:translate-y-1 transition-transform"
          style={{
            background: mode === 'forbidden'
              ? 'linear-gradient(145deg, #ff6b9d, #ff8fab)'
              : 'linear-gradient(145deg, #3498db, #5dade2)',
            boxShadow: mode === 'forbidden' ? '0 8px 0 #d63384' : '0 8px 0 #2471a3',
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
