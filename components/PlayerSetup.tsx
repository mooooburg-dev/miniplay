'use client'
import { useGameStore } from '@/store/gameStore'

export function PlayerSetup() {
  const { players, addPlayer, removePlayer, updatePlayerName, resetScores } =
    useGameStore()

  return (
    <div className="bg-white/80 rounded-2xl p-4 w-full max-w-sm mb-5">
      <h3 className="text-xs text-gray-400 text-center mb-2.5 font-jua">
        👨‍👩‍👦 플레이어 설정 (최대 6명)
      </h3>

      {/* 플레이어 칩 목록 */}
      <div className="flex flex-wrap gap-2 justify-center mb-2.5">
        {players.map((name, i) => (
          <div
            key={i}
            className="flex items-center gap-1 bg-[#ffd6e0] rounded-full px-3 py-1.5"
          >
            <input
              type="text"
              defaultValue={name}
              maxLength={5}
              onBlur={(e) => updatePlayerName(i, e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="bg-transparent border-none outline-none font-jua text-sm text-gray-600 w-14 text-center focus:text-[#ff6b9d]"
            />
            {players.length > 2 && (
              <button
                onClick={() => removePlayer(i)}
                className="text-[#ffaabb] text-sm leading-none hover:text-[#ff6b9d]"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 추가 버튼 */}
      {players.length < 6 && (
        <button
          onClick={addPlayer}
          className="block mx-auto border-2 border-dashed border-[#ffb3cc] rounded-full px-4 py-1 font-jua text-xs text-[#ffb3cc] hover:text-[#ff6b9d] hover:border-[#ff6b9d] transition-colors"
        >
          ＋ 플레이어 추가
        </button>
      )}

      {/* 점수 초기화 */}
      <button
        onClick={resetScores}
        className="block mx-auto mt-2 text-xs text-gray-300 font-jua hover:text-gray-400 transition-colors"
      >
        🔄 점수 초기화
      </button>
    </div>
  )
}
