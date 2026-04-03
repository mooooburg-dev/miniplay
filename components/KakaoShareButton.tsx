'use client'

import { useCallback } from 'react'
import { share } from '@/lib/kakao'
import { trackEvent } from '@/lib/gtag'

interface KakaoShareButtonProps {
  variant: 'home' | 'penalty'
  loserName?: string
}

export function KakaoShareButton({ variant, loserName }: KakaoShareButtonProps) {
  const handleShare = useCallback(async () => {
    trackEvent('kakao_share', { variant })

    if (variant === 'penalty' && loserName) {
      await share({
        title: `${loserName}이(가) 벌칙에 걸렸다! 😱`,
        description: '미니게임 모음에서 두근두근 벌칙 게임 하는 중! 너도 도전해봐~',
        buttonText: '나도 도전하기',
      })
    } else {
      await share({
        title: '미니게임 모음 🎮',
        description: '온가족 함께하는 두근두근 벌칙 게임! 같이 하자~',
        buttonText: '같이 하러 가기',
      })
    }
  }, [variant, loserName])

  if (variant === 'penalty') {
    return (
      <button
        onClick={handleShare}
        className="px-7 py-3 sm:px-9 sm:py-4 rounded-full font-jua text-lg sm:text-xl md:text-2xl text-white border-2 border-white/40 bg-white/25 active:translate-y-1 transition-transform"
      >
        📢 공유하기
      </button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-[5.5rem] right-6 z-40 w-14 h-14 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(255,182,193,0.3)] flex items-center justify-center text-2xl active:scale-90 transition-transform"
      aria-label="카카오톡 공유하기"
    >
      📢
    </button>
  )
}
