import { GAMES, type GameType } from '@/types'
import { SHOP_PICKS } from '@/lib/shop-picks'
import { ShopPickCard } from '@/components/ShopPickCard'

// 게임 안내 시트 FAQ 아래의 "함께 하면 더 재밌는 놀이템" (Server Component)
// 게임 화면·벌칙 오버레이에는 넣지 않는다. 게임당 최대 2개, 비어 있으면 렌더하지 않는다.
export function ShopPicks({ id }: { id: GameType }) {
  const picks = (SHOP_PICKS[id] ?? []).slice(0, 2)
  if (picks.length === 0) return null
  const game = GAMES.find((g) => g.id === id)!

  return (
    <aside aria-labelledby={`picks-${id}`} className="mt-6 font-jua">
      <h2 id={`picks-${id}`} className="text-lg sm:text-xl text-gray-800 mb-2">
        {game.emoji} 함께 하면 더 재밌는 놀이템
      </h2>
      <ul className="space-y-2">
        {picks.map((pick) => (
          <li key={pick.productId}>
            <ShopPickCard pick={pick} game={id} emoji={game.emoji} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-gray-400">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </aside>
  )
}
