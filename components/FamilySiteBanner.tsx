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

// 패밀리 사이트 목록 — 같은 운영자의 사이트를 이름으로 잇는다 (각 사이트 푸터에도 미니플레이가 있어 상호 링크)
const FAMILY_SITES = [
  { id: 'rankingbox', name: '랭킹박스', desc: '쇼핑 랭킹·가격 판정', url: 'https://rankingbox.kr' },
  { id: 'ratebox', name: '금리박스', desc: '예·적금·대출 금리 추이', url: 'https://ratebox.drawyourmind.com' },
  { id: 'paybox', name: '월급박스', desc: '연봉·월급 실수령액', url: 'https://paybox.drawyourmind.com' },
  { id: 'bunyangbox', name: '분양박스', desc: '아파트 분양·청약 경쟁률', url: 'https://bunyangbox.drawyourmind.com' },
  { id: 'pricegap', name: '프라이스갭', desc: '해외직구 가격 기록', url: 'https://pricegap.kr' },
  { id: 'drawyourmind', name: 'drawyourmind', desc: '만든 사람', url: 'https://drawyourmind.com' },
] as const

function familyUrl(url: string) {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'miniplay')
  u.searchParams.set('utm_medium', 'referral')
  u.searchParams.set('utm_campaign', 'family_site')
  return u.toString()
}

export function FamilySiteLinks() {
  return (
    <nav
      aria-label="패밀리 사이트"
      className="w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl mt-4 px-2"
    >
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
        {FAMILY_SITES.map((s) => (
          <li key={s.id}>
            <a
              href={familyUrl(s.url)}
              target="_blank"
              rel="noopener"
              title={s.desc}
              onClick={() => trackEvent('family_site_click', { site: s.id })}
              className="hover:text-[#ff6b9d] transition-colors"
            >
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
