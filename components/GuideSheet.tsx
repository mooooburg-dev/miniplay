'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useAudio } from '@/hooks/useAudio'

interface GuideSheetProps {
  label: string // 버튼·시트 접근성 이름
  children: ReactNode // 서버에서 렌더링된 본문 (닫혀 있어도 HTML에 포함되어 검색엔진이 읽는다)
}

/**
 * 게임 화면 하단 가운데의 📖 버튼 + 바텀시트.
 * 게임 화면은 한 화면에 고정되어 있으므로 안내 본문은 시트 안에서만 스크롤된다.
 */
export function GuideSheet({ label, children }: GuideSheetProps) {
  const [open, setOpen] = useState(false)
  const { playClick } = useAudio()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => {
          playClick()
          setOpen(true)
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-1.5 text-sm text-gray-500 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-95 transition-transform"
      >
        📖 게임 방법
      </button>

      <div
        hidden={!open}
        className="fixed inset-0 z-[60]"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm touch-none" onClick={() => setOpen(false)} />
        <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl max-h-[80dvh] flex flex-col bg-white/95 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] animate-[slideUp_0.25s_ease-out]">
          <div className="flex items-center justify-end px-4 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-500 font-jua active:scale-95"
            >
              닫기 ✕
            </button>
          </div>
          {/* 시트 안에서만 세로 스크롤 (바깥 화면으로 번지지 않게) */}
          <div className="overflow-y-auto overscroll-contain touch-pan-y px-5 pb-8 sm:px-7">{children}</div>
        </div>
      </div>
    </>
  )
}
