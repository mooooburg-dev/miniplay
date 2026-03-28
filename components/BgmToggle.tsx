'use client'
import { useBgm, useBgmStore } from '@/hooks/useBgm'

export function BgmToggle() {
  // BGM 엔진 활성화
  useBgm()

  const playing = useBgmStore((s) => s.playing)
  const toggle = useBgmStore((s) => s.toggle)

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(255,182,193,0.25)] flex items-center justify-center text-lg sm:text-xl active:scale-90 transition-all hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,182,193,0.4)]"
      title={playing ? 'BGM 끄기' : 'BGM 켜기'}
      aria-label={playing ? 'BGM 끄기' : 'BGM 켜기'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  )
}
