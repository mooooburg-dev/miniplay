'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { trackEvent } from '@/lib/gtag'

const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc']
const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const LADDER_ROWS = 8

interface Bridge {
  row: number
  col: number
}

type Phase = 'edit' | 'ready' | 'running' | 'done'

export default function LadderPage() {
  const router = useRouter()
  const { players: storePlayers, hydrate } = useGameStore()
  const { playClick, playTick, playFanfare } = useAudio()

  const [phase, setPhase] = useState<Phase>('edit')
  const [playerCount, setPlayerCount] = useState(4)
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => `${i + 1}번`)
  )
  const [results, setResults] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => i === 0 ? '당첨!' : '꽝')
  )
  const [initialized, setInitialized] = useState(false)

  // hydrate 후 스토어 플레이어 반영
  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (initialized) return
    if (storePlayers.length >= MIN_PLAYERS) {
      setPlayerCount(Math.min(storePlayers.length, MAX_PLAYERS))
      setNames((prev) => {
        const next = [...prev]
        storePlayers.forEach((name, i) => {
          if (i < MAX_PLAYERS) next[i] = name
        })
        return next
      })
      setInitialized(true)
    }
  }, [storePlayers, initialized])
  const [bridges, setBridges] = useState<Bridge[]>([])
  const [runPaths, setRunPaths] = useState<{ x: number; y: number; col: number }[][]>([])
  const [animStep, setAnimStep] = useState(-1)
  const [selectedRunner, setSelectedRunner] = useState<number | null>(null)
  const [revealedResults, setRevealedResults] = useState<boolean[]>([])
  const [resultsHidden, setResultsHidden] = useState(true)
  const [editingName, setEditingName] = useState<number | null>(null)
  const [editingResult, setEditingResult] = useState<number | null>(null)
  const [finishedRunners, setFinishedRunners] = useState<Set<number>>(new Set())

  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedRef = useRef(false)

  // 인원 변경 시 결과 배열 동기화
  useEffect(() => {
    setResults((prev) => Array.from({ length: playerCount }, (_, i) => prev[i] ?? '꽝'))
  }, [playerCount])

  // 인원 변경 시 기존 bridges 중 범위 밖 제거
  useEffect(() => {
    setBridges((prev) => prev.filter((b) => b.col < playerCount - 1))
  }, [playerCount])

  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current)
    }
  }, [])

  const changePlayerCount = useCallback(
    (delta: number) => {
      setPlayerCount((prev) => {
        const next = prev + delta
        if (next < MIN_PLAYERS || next > MAX_PLAYERS) return prev
        playClick()
        return next
      })
    },
    [playClick]
  )

  // 가로선 토글
  const toggleBridge = useCallback(
    (row: number, col: number) => {
      if (phase !== 'edit') return
      playClick()
      setBridges((prev) => {
        const exists = prev.find((b) => b.row === row && b.col === col)
        if (exists) return prev.filter((b) => !(b.row === row && b.col === col))
        // 교차 방지
        const hasLeft = prev.find((b) => b.row === row && b.col === col - 1)
        const hasRight = prev.find((b) => b.row === row && b.col === col + 1)
        if (hasLeft || hasRight) return prev
        return [...prev, { row, col }]
      })
    },
    [phase, playClick]
  )

  // 직각 경로 계산: {x, y} 좌표 배열 반환
  // 세로로 내려가다 가로선을 만나면 직각으로 꺾임
  const calcPath = useCallback(
    (startCol: number): { x: number; y: number; col: number }[] => {
      const colGapLocal = 100 / (playerCount + 1)
      const getX = (c: number) => colGapLocal * (c + 1)
      const getY = (r: number) => r === 0 ? 4 : 4 + (r * 92) / (LADDER_ROWS + 1)

      let col = startCol
      const points: { x: number; y: number; col: number }[] = [
        { x: getX(col), y: getY(0), col }
      ]

      for (let row = 0; row < LADDER_ROWS; row++) {
        const y = getY(row + 1)
        const goRight = bridges.find((b) => b.row === row && b.col === col)
        const goLeft = bridges.find((b) => b.row === row && b.col === col - 1)

        if (goRight) {
          // 세로로 가로선 높이까지 내려감 → 가로로 오른쪽 이동
          points.push({ x: getX(col), y, col })
          col = col + 1
          points.push({ x: getX(col), y, col })
        } else if (goLeft) {
          // 세로로 가로선 높이까지 내려감 → 가로로 왼쪽 이동
          points.push({ x: getX(col), y, col })
          col = col - 1
          points.push({ x: getX(col), y, col })
        } else {
          // 그냥 세로로 내려감
          points.push({ x: getX(col), y, col })
        }
      }

      // 마지막 하단까지
      points.push({ x: getX(col), y: 96, col })
      return points
    },
    [bridges, playerCount]
  )

  const randomizeBridges = useCallback(() => {
    playClick()
    const newBridges: Bridge[] = []
    for (let row = 0; row < LADDER_ROWS; row++) {
      const usedCols = new Set<number>()
      for (let col = 0; col < playerCount - 1; col++) {
        if (usedCols.has(col) || usedCols.has(col - 1)) continue
        if (Math.random() < 0.4) {
          newBridges.push({ row, col })
          usedCols.add(col)
        }
      }
    }
    setBridges(newBridges)
  }, [playerCount, playClick])

  const startRun = useCallback(
    (runnerIndex?: number) => {
      if (!trackedRef.current) {
        trackEvent('game_start', { game_name: 'ladder' })
        trackedRef.current = true
      }
      playClick()
      setEditingName(null)
      setEditingResult(null)

      const paths = Array.from({ length: playerCount }, (_, i) => calcPath(i))
      setRunPaths(paths)

      const isSingle = runnerIndex !== undefined
      setSelectedRunner(isSingle ? runnerIndex : null)

      if (!isSingle) {
        setRevealedResults(Array(playerCount).fill(false))
      }

      // 해당 runner의 경로 길이 (또는 전체 중 최대)
      const maxSteps = isSingle
        ? paths[runnerIndex].length - 1
        : Math.max(...paths.map((p) => p.length - 1))

      setPhase('running')
      setAnimStep(0)

      let step = 0
      const advance = () => {
        step++
        if (step <= maxSteps) {
          setAnimStep(step)
          playTick()
          animRef.current = setTimeout(advance, 180)
        } else {
          if (isSingle) {
            // 한 명 완료: 해당 결과만 공개하고 ready로 복귀
            const destCol = paths[runnerIndex][paths[runnerIndex].length - 1].col
            setRevealedResults((prev) => {
              const next = [...prev]
              next[destCol] = true
              return next
            })
            setFinishedRunners((prev) => {
              const next = new Set(prev)
              next.add(runnerIndex)
              // 모두 완료되었으면 done
              if (next.size >= playerCount) {
                setPhase('done')
                setResultsHidden(false)
                playFanfare()
              } else {
                setPhase('ready')
                playFanfare()
              }
              return next
            })
          } else {
            // 전체 출발 완료
            setPhase('done')
            setResultsHidden(false)
            setRevealedResults(Array(playerCount).fill(true))
            playFanfare()
          }
        }
      }
      animRef.current = setTimeout(advance, 300)
    },
    [playerCount, calcPath, playClick, playTick, playFanfare]
  )

  const reset = useCallback(() => {
    setBridges([])
    setRunPaths([])
    setAnimStep(-1)
    setSelectedRunner(null)
    setRevealedResults([])
    setResultsHidden(true)
    setFinishedRunners(new Set())
    setPhase('edit')
    if (animRef.current) clearTimeout(animRef.current)
  }, [])

  const colGap = 100 / (playerCount + 1)
  const getColX = (col: number) => colGap * (col + 1)

  const getAnimPos = (pathIndex: number) => {
    if (animStep < 0 || !runPaths[pathIndex]) return null
    const path = runPaths[pathIndex]
    const step = Math.min(animStep, path.length - 1)
    return path[step]
  }

  const isEditing = phase === 'edit'

  return (
    <div className="game-screen">
      <button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
      >
        &larr; 홈으로
      </button>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-jua text-[#f59e0b] mb-2">
        🪜 사다리 게임
      </h1>

      {/* 인원 수 조절 (편집 모드에서만) */}
      {isEditing && (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => changePlayerCount(-1)}
            disabled={playerCount <= MIN_PLAYERS}
            className="w-8 h-8 rounded-full bg-white/80 border border-white/60 font-jua text-gray-500 text-lg disabled:opacity-30 active:scale-90 transition-all"
          >
            -
          </button>
          <span className="font-jua text-gray-600 text-sm">{playerCount}명</span>
          <button
            onClick={() => changePlayerCount(1)}
            disabled={playerCount >= MAX_PLAYERS}
            className="w-8 h-8 rounded-full bg-white/80 border border-white/60 font-jua text-gray-500 text-lg disabled:opacity-30 active:scale-90 transition-all"
          >
            +
          </button>
        </div>
      )}

      <div className="w-full max-w-lg space-y-2">
        {/* 상단 이름 */}
        <div className="flex justify-around px-1">
          {Array.from({ length: playerCount }, (_, i) => {
            const isFinished = finishedRunners.has(i)
            const isActive =
              phase === 'running' || phase === 'done'
                ? selectedRunner === null || selectedRunner === i
                : !isFinished
            const canClick = phase === 'ready' && !isFinished
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                {editingName === i ? (
                  <input
                    autoFocus
                    value={names[i]}
                    onChange={(e) => {
                      const next = [...names]
                      next[i] = e.target.value
                      setNames(next)
                    }}
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                    maxLength={6}
                    className="w-14 sm:w-16 px-1 py-0.5 rounded-lg text-center font-jua text-xs sm:text-sm bg-white border-2 focus:outline-none"
                    style={{ borderColor: COLORS[i] }}
                  />
                ) : (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingName(i)
                      } else if (canClick) {
                        startRun(i)
                      }
                    }}
                    disabled={phase === 'ready' && isFinished}
                    className={`font-jua text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                      isActive ? 'opacity-100' : 'opacity-30'
                    } ${canClick ? 'hover:scale-110 animate-pulse-glow' : ''} ${isEditing ? 'hover:scale-105' : ''}`}
                    style={{
                      background: COLORS[i],
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    {names[i]}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 사다리 본체 */}
        <div className="relative w-full aspect-[3/4] bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
          >
            {/* 세로 기둥 */}
            {Array.from({ length: playerCount }, (_, col) => (
              <line
                key={`v-${col}`}
                x1={getColX(col)}
                y1={4}
                x2={getColX(col)}
                y2={96}
                stroke={COLORS[col]}
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity={0.5}
              />
            ))}

            {/* 가로줄 힌트 (편집 모드, 점선) */}
            {isEditing &&
              Array.from({ length: LADDER_ROWS }, (_, row) => {
                const y = 4 + ((row + 1) * 92) / (LADDER_ROWS + 1)
                return (
                  <line
                    key={`hint-${row}`}
                    x1={getColX(0)}
                    y1={y}
                    x2={getColX(playerCount - 1)}
                    y2={y}
                    stroke="#d4a574"
                    strokeWidth="0.2"
                    strokeDasharray="1 1"
                    opacity={0.4}
                  />
                )
              })}

            {/* 가로선 클릭 영역 */}
            {isEditing &&
              Array.from({ length: LADDER_ROWS }, (_, row) =>
                Array.from({ length: playerCount - 1 }, (_, col) => {
                  const y = 4 + ((row + 1) * 92) / (LADDER_ROWS + 1)
                  const x1 = getColX(col)
                  const x2 = getColX(col + 1)
                  const hasBridge = bridges.some((b) => b.row === row && b.col === col)
                  return (
                    <g key={`click-${row}-${col}`}>
                      {/* 호버 힌트 */}
                      {!hasBridge && (
                        <line
                          x1={x1}
                          y1={y}
                          x2={x2}
                          y2={y}
                          stroke="#d97706"
                          strokeWidth="0.6"
                          strokeDasharray="1.5 1"
                          opacity={0}
                          className="hover:opacity-40 transition-opacity"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                      <rect
                        x={x1}
                        y={y - 3.5}
                        width={x2 - x1}
                        height={7}
                        fill="transparent"
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        onClick={() => toggleBridge(row, col)}
                      />
                    </g>
                  )
                })
              )}

            {/* 가로선 (다리) */}
            {bridges.map((b) => {
              const y = 4 + ((b.row + 1) * 92) / (LADDER_ROWS + 1)
              const x1 = getColX(b.col)
              const x2 = getColX(b.col + 1)
              return (
                <line
                  key={`b-${b.row}-${b.col}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#92400e"
                  strokeWidth="1"
                  strokeLinecap="round"
                  className="transition-all"
                  style={{ pointerEvents: isEditing ? 'all' : 'none', cursor: isEditing ? 'pointer' : 'default' }}
                  onClick={() => toggleBridge(b.row, b.col)}
                />
              )
            })}

            {/* 애니메이션 마커 */}
            {(phase === 'running' || phase === 'done') &&
              Array.from({ length: playerCount }, (_, i) => {
                if (selectedRunner !== null && selectedRunner !== i) return null
                const pos = getAnimPos(i)
                if (!pos) return null
                return (
                  <circle
                    key={`anim-${i}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={2}
                    fill={COLORS[i]}
                    stroke="#fff"
                    strokeWidth="0.5"
                    className="transition-all duration-150"
                  >
                    <animate
                      attributeName="r"
                      values="1.8;2.5;1.8"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )
              })}

            {/* 경로 라인 — 완료된 플레이어의 직각 경로 */}
            {runPaths.map((path, i) => {
              if (!finishedRunners.has(i) && phase !== 'done') return null
              if (phase === 'done' && selectedRunner !== null && selectedRunner !== i && !finishedRunners.has(i)) return null
              const points = path.map((p) => `${p.x},${p.y}`).join(' ')
              return (
                <polyline
                  key={`path-${i}`}
                  points={points}
                  fill="none"
                  stroke={COLORS[i]}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              )
            })}
          </svg>

          {/* 편집 모드 안내 */}
          {isEditing && bridges.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="font-jua text-amber-800/30 text-sm sm:text-base text-center px-4">
                사다리 사이를 터치해서<br />가로선을 그려보세요!
              </p>
            </div>
          )}
        </div>

        {/* 하단 결과 */}
        <div className="flex justify-around px-1">
          {Array.from({ length: playerCount }, (_, i) => {
            const revealed = revealedResults[i]
            let arrivedColor = '#9ca3af'
            if (phase === 'done') {
              for (let p = 0; p < playerCount; p++) {
                if (selectedRunner !== null && selectedRunner !== p) continue
                const lastPt = runPaths[p]?.[runPaths[p].length - 1]
                if (lastPt?.col === i) {
                  arrivedColor = COLORS[p]
                  break
                }
              }
            }

            if (editingResult === i) {
              return (
                <input
                  key={i}
                  autoFocus
                  value={results[i]}
                  onChange={(e) => {
                    const next = [...results]
                    next[i] = e.target.value
                    setResults(next)
                  }}
                  onBlur={() => setEditingResult(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingResult(null)}
                  maxLength={8}
                  className="w-14 sm:w-16 px-1 py-0.5 rounded-lg text-center font-jua text-xs sm:text-sm bg-white border-2 border-amber-300 focus:outline-none"
                />
              )
            }

            return (
              <button
                key={i}
                onClick={() => {
                  if (isEditing) setEditingResult(i)
                }}
                className={`font-jua text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                  revealed ? 'scale-110 animate-land-pop' : ''
                } ${isEditing ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                style={
                  revealed
                    ? {
                        background: arrivedColor,
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }
                    : resultsHidden
                      ? { background: '#e5e7eb', color: '#9ca3af' }
                      : { background: '#f3f4f6', color: '#6b7280' }
                }
              >
                {resultsHidden && !revealed ? '?' : results[i]}
              </button>
            )
          })}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {isEditing && (
            <>
              <button
                onClick={randomizeBridges}
                className="action-btn px-4 py-2 rounded-2xl font-jua text-white text-sm"
                style={{
                  background: 'linear-gradient(145deg, #8b5cf6, #a78bfa)',
                  boxShadow: '0 4px 0 #6d28d9',
                }}
              >
                🎲 랜덤
              </button>
              {bridges.length > 0 && (
                <button
                  onClick={() => {
                    setBridges([])
                    playClick()
                  }}
                  className="action-btn px-4 py-2 rounded-2xl font-jua text-white text-sm"
                  style={{
                    background: 'linear-gradient(145deg, #ef4444, #f87171)',
                    boxShadow: '0 4px 0 #b91c1c',
                  }}
                >
                  지우기
                </button>
              )}
              <button
                onClick={() => {
                  playClick()
                  setPhase('ready')
                }}
                disabled={bridges.length === 0}
                className="action-btn px-6 py-2 rounded-2xl font-jua text-white text-sm disabled:opacity-40"
                style={{
                  background: 'linear-gradient(145deg, #f59e0b, #fbbf24)',
                  boxShadow: '0 4px 0 #d97706',
                }}
              >
                출발 준비!
              </button>
            </>
          )}

          {phase === 'ready' && (
            <div className="text-center space-y-2 w-full">
              <p className="font-jua text-gray-500 text-xs sm:text-sm">
                이름을 눌러 한 명씩 출발하거나
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    playClick()
                    setPhase('edit')
                  }}
                  className="action-btn px-5 py-2.5 rounded-2xl font-jua text-gray-500 text-sm bg-white/70 border border-white/80"
                >
                  &larr; 수정
                </button>
                <button
                  onClick={() => startRun()}
                  className="action-btn px-8 py-2.5 rounded-2xl font-jua text-white text-lg"
                  style={{
                    background: 'linear-gradient(145deg, #f59e0b, #fbbf24)',
                    boxShadow: '0 5px 0 #d97706',
                  }}
                >
                  🚀 전체 출발!
                </button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center space-y-3 w-full">
              {/* 결과 요약 */}
              <div className="glass-card p-4 space-y-1">
                {runPaths.map((path, i) => {
                  if (selectedRunner !== null && selectedRunner !== i) return null
                  const dest = path[path.length - 1].col
                  return (
                    <p key={i} className="font-jua text-sm">
                      <span style={{ color: COLORS[i] }}>{names[i]}</span>
                      <span className="text-gray-400"> → </span>
                      <span className="text-gray-700">{results[dest]}</span>
                    </p>
                  )
                })}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={reset}
                  className="action-btn px-6 py-2.5 rounded-2xl font-jua text-white text-base"
                  style={{
                    background: 'linear-gradient(145deg, #f59e0b, #fbbf24)',
                    boxShadow: '0 4px 0 #d97706',
                  }}
                >
                  🔄 다시 하기
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="action-btn px-6 py-2.5 rounded-2xl font-jua text-gray-500 text-base bg-white/70 border border-white/80"
                >
                  홈으로
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
