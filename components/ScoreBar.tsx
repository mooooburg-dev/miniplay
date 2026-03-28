'use client'
import { useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'

interface ScoreBarProps {
  players: string[]
  scores: number[]
  currentTurn: number
  activeColor?: string
}

export function ScoreBar({
  players,
  scores,
  currentTurn,
  activeColor = '#ff6b9d',
}: ScoreBarProps) {
  const swapPlayers = useGameStore((s) => s.swapPlayers)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const chipRefs = useRef<(HTMLElement | null)[]>([])
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)

  // -- 터치 DnD --
  const handleTouchStart = useCallback((i: number, e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
    setDragIdx(i)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragIdx === null) return
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (dx > 8 || dy > 8) isDragging.current = true

      // 현재 터치 위치에 해당하는 칩 찾기
      const touch = e.touches[0]
      const found = chipRefs.current.findIndex((el) => {
        if (!el) return false
        const r = el.getBoundingClientRect()
        return (
          touch.clientX >= r.left &&
          touch.clientX <= r.right &&
          touch.clientY >= r.top &&
          touch.clientY <= r.bottom
        )
      })
      setOverIdx(found >= 0 ? found : null)
    },
    [dragIdx],
  )

  const handleTouchEnd = useCallback(() => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx && isDragging.current) {
      swapPlayers(dragIdx, overIdx)
    }
    setDragIdx(null)
    setOverIdx(null)
    isDragging.current = false
  }, [dragIdx, overIdx, swapPlayers])

  // -- 마우스 DnD (HTML drag) --
  const handleDragStart = useCallback((i: number) => {
    setDragIdx(i)
  }, [])

  const handleDragOver = useCallback((i: number, e: React.DragEvent) => {
    e.preventDefault()
    setOverIdx(i)
  }, [])

  const handleDrop = useCallback(
    (i: number) => {
      if (dragIdx !== null && dragIdx !== i) {
        swapPlayers(dragIdx, i)
      }
      setDragIdx(null)
      setOverIdx(null)
    },
    [dragIdx, swapPlayers],
  )

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setOverIdx(null)
  }, [])

  return (
    <div
      className="flex flex-wrap gap-1.5 sm:gap-2.5 justify-center mb-3.5"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {players.map((player, i) => {
        const isActive = i === currentTurn
        const isBeingDragged = i === dragIdx
        const isDropTarget = i === overIdx && overIdx !== dragIdx

        return (
          <span
            key={i}
            ref={(el) => { chipRefs.current[i] = el }}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(i, e)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(i, e)}
            className="px-3.5 py-1 sm:px-5 sm:py-1.5 rounded-full text-xs sm:text-sm md:text-base font-jua transition-all duration-200 cursor-grab active:cursor-grabbing select-none"
            style={{
              ...(isActive
                ? { background: activeColor, color: 'white', transform: 'scale(1.08)' }
                : { background: 'rgba(255,255,255,0.6)', color: '#666' }),
              ...(isBeingDragged ? { opacity: 0.5, transform: 'scale(0.95)' } : {}),
              ...(isDropTarget
                ? {
                    boxShadow: `0 0 0 2px ${activeColor}, 0 0 12px ${activeColor}50`,
                    transform: 'scale(1.12)',
                  }
                : {}),
            }}
          >
            {player} {scores[i] > 0 ? '💀'.repeat(Math.min(scores[i], 5)) : '😊'}
          </span>
        )
      })}
    </div>
  )
}
