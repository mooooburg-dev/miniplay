'use client'
import { trackEvent } from '@/lib/gtag'

// 패밀리 사이트 배너 — 골드박스 투데이(goldbox.today) 푸터에도 미니플레이 배너가 있어 상호 링크
const GOLDBOX_URL =
  'https://goldbox.today/?utm_source=miniplay&utm_medium=referral&utm_campaign=family_banner'

export function FamilySiteBanner() {
  return (
    <a
      href={GOLDBOX_URL}
      target="_blank"
      rel="noopener"
      onClick={() => trackEvent('family_site_click', { site: 'goldbox' })}
      className="glass-card w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl mt-6 px-5 py-4 flex items-center gap-3 font-jua transition-all hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <span className="text-3xl" aria-hidden>
        🛒
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-base sm:text-lg text-[#f59e0b]">엄마·아빠를 위한 오늘의 특가</span>
        <span className="block text-xs sm:text-sm text-gray-400">
          매일 아침 쿠팡 골드박스 특가를 가격 기록과 함께 · 골드박스 투데이
        </span>
      </span>
      <span className="text-gray-300" aria-hidden>
        ↗
      </span>
    </a>
  )
}
