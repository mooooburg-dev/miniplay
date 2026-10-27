'use client'
import { useEffect, useRef, useState } from 'react'
import type { GameType } from '@/types'
import { shopPickUrl, type ShopPick } from '@/lib/shop-picks'
import { trackEvent } from '@/lib/gtag'

// 놀이템 카드 한 개 — 클릭 추적과 썸네일 폴백 때문에 client
export function ShopPickCard({ pick, game, emoji }: { pick: ShopPick; game: GameType; emoji: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // hydration 전에 이미 로드에 실패한 이미지는 onError가 다시 오지 않으므로 마운트 시 한 번 확인
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth === 0) setImgFailed(true)
  }, [])

  return (
    <a
      href={shopPickUrl(pick.productId, game)}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={() => trackEvent('shop_pick_click', { game, product_id: String(pick.productId) })}
      className="glass-card !rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <span className="w-14 h-14 shrink-0 rounded-xl bg-white overflow-hidden flex items-center justify-center">
        {imgFailed ? (
          <span className="text-2xl" aria-hidden>
            {emoji}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={pick.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-sm sm:text-base text-gray-700 leading-snug line-clamp-2">{pick.name}</span>
        <span className="block text-xs text-gray-400 truncate">{pick.note}</span>
      </span>
      <span className="shrink-0 text-xs text-gray-400">보러 가기 ↗</span>
    </a>
  )
}
