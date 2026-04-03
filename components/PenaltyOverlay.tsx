'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KakaoShareButton } from '@/components/KakaoShareButton'

const EMOJIS = ['😱', '😭', '🙈', '🤦', '💀', '😰', '🙀', '😬', '🤯', '🥴']
const PARTICLES = ['⭐', '🌟', '💫', '🎉', '🎊', '🍭', '🌈', '🦄', '🐥', '🍀', '🌸', '🎈']

interface Particle {
  id: number
  emoji: string
  x: number
  y: number
  tx: string
  ty: string
  rot: string
  size: number
  delay: number
}

interface PenaltyOverlayProps {
  isOpen: boolean
  loserName: string
  onRetry: () => void
}

export function PenaltyOverlay({ isOpen, loserName, onRetry }: PenaltyOverlayProps) {
  const router = useRouter()
  const [emoji, setEmoji] = useState('😱')
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!isOpen) return
    setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)])

    // 파티클 생성
    const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 200
    const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 300
    const newParticles: Particle[] = Array.from({ length: 22 }, (_, i) => {
      const angle = Math.random() * 360
      const dist = 110 + Math.random() * 210
      return {
        id: i,
        emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)],
        x: cx,
        y: cy,
        tx: `${Math.cos((angle * Math.PI) / 180) * dist}px`,
        ty: `${Math.sin((angle * Math.PI) / 180) * dist - 90}px`,
        rot: `${(Math.random() - 0.5) * 720}deg`,
        size: 1.1 + Math.random() * 1.6,
        delay: Math.random() * 0.25,
      }
    })
    setParticles(newParticles)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #ff6b9d, #ff4081)' }}
    >
      {/* 파티클 */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="fixed pointer-events-none animate-particle-fly"
          style={{
            left: p.x,
            top: p.y,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['--tx' as any]: p.tx,
            ['--ty' as any]: p.ty,
            ['--rot' as any]: p.rot,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* 메인 콘텐츠 */}
      <div className="text-center animate-penalty-in">
        <span className="text-8xl sm:text-9xl md:text-[10rem] block mb-4 animate-wiggle">{emoji}</span>
        <p className="text-white/80 font-jua text-lg sm:text-xl md:text-2xl mb-1">벌칙 당첨!</p>
        <p
          className="text-white font-jua text-5xl sm:text-6xl md:text-7xl mb-1"
          style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.15)' }}
        >
          {loserName}
        </p>
        <p className="text-white font-jua text-2xl sm:text-3xl md:text-4xl mb-8">이(가) 걸렸다! 🎊</p>
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-7 py-3 sm:px-9 sm:py-4 rounded-full bg-white text-[#ff6b9d] font-jua text-lg sm:text-xl md:text-2xl shadow-md active:translate-y-1 transition-transform"
          >
            🔄 다시 하기
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-7 py-3 sm:px-9 sm:py-4 rounded-full font-jua text-lg sm:text-xl md:text-2xl text-white border-2 border-white/40 bg-white/25 active:translate-y-1 transition-transform"
          >
            🏠 홈으로
          </button>
          <KakaoShareButton variant="penalty" loserName={loserName} />
        </div>
      </div>
    </div>
  )
}
