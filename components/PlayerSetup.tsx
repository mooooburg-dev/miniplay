'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const PRESETS = [
  { label: '👩 엄마', name: '엄마' },
  { label: '👨 아빠', name: '아빠' },
  { label: '👵 할머니', name: '할머니' },
  { label: '👴 할아버지', name: '할아버지' },
  { label: '👦 오빠', name: '오빠' },
  { label: '👧 언니', name: '언니' },
  { label: '👦 형', name: '형' },
  { label: '👧 누나', name: '누나' },
]

export function PlayerSetup() {
  const { players, addPlayerByName, removePlayer, resetScores } =
    useGameStore()
  const [customName, setCustomName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAddCustom = () => {
    const trimmed = customName.trim()
    if (trimmed && players.length < 6 && !players.includes(trimmed)) {
      addPlayerByName(trimmed)
      setCustomName('')
      setShowInput(false)
    }
  }

  return (
    <div className="glass-card w-full max-w-sm mb-6 p-5">
      <h3 className="text-[13px] text-gray-500 text-center mb-4 font-jua flex justify-center items-center gap-1.5 opacity-80">
        <span>👨‍👩‍👦</span> 누가 플레이하나요? (2~6명)
      </h3>

      {/* 선택된 플레이어 */}
      {players.length > 0 && (
        <div className="flex flex-wrap gap-2.5 justify-center mb-4">
          {players.map((name, i) => (
            <button
              key={i}
              onClick={() => removePlayer(i)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFB3CC] to-[#FF9EBC] text-white shadow-[0_4px_12px_rgba(255,179,204,0.4)] rounded-full px-4 py-1.5 font-jua text-sm active:scale-95 transition-all hover:-translate-y-0.5 group"
            >
              {name}
              <span className="bg-white/30 rounded-full w-4 h-4 flex items-center justify-center text-[10px] ml-0.5 group-hover:bg-white/50 transition-colors">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* 프리셋 버튼 */}
      {players.length < 6 && (
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {PRESETS.filter((p) => !players.includes(p.name)).map((preset) => (
            <button
              key={preset.name}
              onClick={() => addPlayerByName(preset.name)}
              className="bg-white/50 backdrop-blur-sm border border-white/80 rounded-full px-3.5 py-1.5 font-jua text-xs text-[#8c8d91] active:scale-95 hover:bg-white hover:text-[#555] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
            >
              {preset.label}
            </button>
          ))}

          {/* 직접 입력 토글 */}
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="bg-[#E6D5FF]/40 border border-[#E6D5FF] rounded-full px-3.5 py-1.5 font-jua text-xs text-[#9b85d6] active:scale-95 hover:bg-[#E6D5FF]/70 transition-all hover:shadow-[0_2px_8px_rgba(155,133,214,0.2)] flex items-center gap-1"
            >
              <span>✏️</span> 직접 입력
            </button>
          ) : (
            <div className="flex items-center gap-1.5 w-full justify-center mt-2 p-1 bg-white/50 rounded-full shadow-inner">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                placeholder="이름 입력"
                maxLength={5}
                autoFocus
                className="bg-transparent px-3 py-1 font-jua text-sm text-gray-700 w-24 text-center outline-none placeholder:text-gray-400"
              />
              <button
                onClick={handleAddCustom}
                className="bg-gradient-to-r from-[#c8b4ff] to-[#b399ff] text-white rounded-full px-4 py-1.5 font-jua text-xs shadow-[0_2px_8px_rgba(200,180,255,0.4)] active:scale-95 transition-all"
              >
                +
              </button>
              <button
                onClick={() => {
                  setShowInput(false)
                  setCustomName('')
                }}
                className="text-gray-400 px-2 py-1 text-xs hover:text-gray-600 transition-colors"
                title="취소"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* 점수 초기화 */}
      {players.length > 0 && (
        <button
          onClick={resetScores}
          className="block mx-auto mt-4 text-[11px] text-gray-400 font-jua hover:text-[#ff8fab] transition-colors"
        >
          🔄 점수 초기화
        </button>
      )}
    </div>
  )
}
