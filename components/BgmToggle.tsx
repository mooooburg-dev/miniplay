'use client'
import { useBgm, useBgmStore } from '@/hooks/useBgm'

export function BgmToggle() {
  useBgm()

  const playing = useBgmStore((s) => s.playing)
  const toggle = useBgmStore((s) => s.toggle)

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(255,182,193,0.25)] flex items-center justify-center active:scale-90 transition-all hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,182,193,0.4)]"
      title={playing ? 'BGM 끄기' : 'BGM 켜기'}
      aria-label={playing ? 'BGM 끄기' : 'BGM 켜기'}
    >
      {playing ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  )
}
