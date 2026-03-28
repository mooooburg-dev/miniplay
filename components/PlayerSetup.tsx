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
    <div className="bg-white/80 rounded-2xl p-4 w-full max-w-sm mb-5">
      <h3 className="text-xs text-gray-400 text-center mb-3 font-jua">
        👨‍👩‍👦 누가 플레이하나요? (2~6명)
      </h3>

      {/* 선택된 플레이어 */}
      {players.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {players.map((name, i) => (
            <button
              key={i}
              onClick={() => removePlayer(i)}
              className="flex items-center gap-1 bg-[#ffd6e0] rounded-full px-3 py-1.5 font-jua text-sm text-gray-600 active:scale-95 transition-transform"
            >
              {name}
              <span className="text-[#ffaabb] text-xs">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* 프리셋 버튼 */}
      {players.length < 6 && (
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {PRESETS.filter((p) => !players.includes(p.name)).map((preset) => (
            <button
              key={preset.name}
              onClick={() => addPlayerByName(preset.name)}
              className="border-2 border-dashed border-[#ffb3cc] rounded-full px-3 py-1.5 font-jua text-xs text-[#cc7a94] active:scale-95 active:bg-[#fff0f5] transition-all"
            >
              {preset.label}
            </button>
          ))}

          {/* 직접 입력 토글 */}
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="border-2 border-dashed border-[#c8b4ff] rounded-full px-3 py-1.5 font-jua text-xs text-[#9b85d6] active:scale-95 active:bg-[#f5f0ff] transition-all"
            >
              ✏️ 직접 입력
            </button>
          ) : (
            <div className="flex items-center gap-1.5 w-full justify-center mt-1">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                placeholder="이름 입력"
                maxLength={5}
                autoFocus
                className="border-2 border-[#c8b4ff] rounded-full px-3 py-1.5 font-jua text-sm text-gray-600 w-24 text-center outline-none focus:border-[#9b85d6]"
              />
              <button
                onClick={handleAddCustom}
                className="bg-[#c8b4ff] text-white rounded-full px-3 py-1.5 font-jua text-xs active:scale-95 transition-transform"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowInput(false)
                  setCustomName('')
                }}
                className="text-gray-300 text-sm"
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
          className="block mx-auto mt-1 text-xs text-gray-300 font-jua hover:text-gray-400 transition-colors"
        >
          🔄 점수 초기화
        </button>
      )}
    </div>
  )
}
