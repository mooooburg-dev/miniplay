'use client'

import { useState, useCallback } from 'react'

type FeedbackType = '🎮 새 게임 아이디어' | '💡 이런 게 있으면 좋겠어요' | '🐛 이상해요' | '💕 좋아요!'

const FEEDBACK_TYPES: FeedbackType[] = [
  '🎮 새 게임 아이디어',
  '💡 이런 게 있으면 좋겠어요',
  '🐛 이상해요',
  '💕 좋아요!',
]

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const reset = useCallback(() => {
    setSelectedType(null)
    setMessage('')
    setStatus('idle')
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // 닫힌 후 상태 리셋
    setTimeout(reset, 300)
  }, [reset])

  const submit = useCallback(async () => {
    if (!selectedType || !message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [selectedType, message])

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(255,182,193,0.3)] flex items-center justify-center text-2xl active:scale-90 transition-transform"
        aria-label="의견 보내기"
      >
        💌
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 glass-card p-6 animate-[slideUp_0.3s_ease] font-jua">
            {status === 'done' ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-lg text-gray-700">고마워요! 의견이 전달됐어요</p>
                <button
                  onClick={close}
                  className="mt-4 px-6 py-2 rounded-full bg-[#ff6b9d] text-white action-btn"
                >
                  닫기
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-[#ff6b9d]">우리 가족 의견함 💌</h2>
                  <button
                    onClick={close}
                    className="text-gray-600 text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* 카테고리 선택 */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {FEEDBACK_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-2 rounded-2xl text-sm border transition-all ${
                        selectedType === type
                          ? 'bg-[#ff6b9d]/15 border-[#ff6b9d]/40 text-[#ff6b9d]'
                          : 'bg-white/50 border-white/60 text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* 메시지 입력 */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="여기에 적어주세요 ✏️"
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/60 text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 font-jua text-sm"
                />
                <div className="text-right text-xs text-gray-500 mt-1 mr-1">
                  {message.length}/500
                </div>

                {/* 전송 버튼 */}
                <button
                  onClick={submit}
                  disabled={!selectedType || !message.trim() || status === 'sending'}
                  className="w-full mt-2 py-3 rounded-2xl bg-[#ff6b9d] text-white action-btn disabled:opacity-40 disabled:active:scale-100"
                >
                  {status === 'sending' ? '보내는 중...' : status === 'error' ? '다시 시도하기' : '보내기 ✈️'}
                </button>

                {status === 'error' && (
                  <p className="text-center text-xs text-red-400 mt-2">
                    앗, 전송에 실패했어요. 다시 눌러주세요!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
