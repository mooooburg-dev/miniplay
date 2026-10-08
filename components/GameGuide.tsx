import { GAMES, type GameType } from '@/types'
import { GAME_SEO, gameJsonLd } from '@/lib/game-seo'
import { GuideSheet } from '@/components/GuideSheet'

// 게임 "하는 방법"·FAQ (Server Component) — 게임 화면 하단 📖 버튼으로 여는 바텀시트에 담긴다.
// 본문과 구조화 데이터(JSON-LD)는 서버에서 렌더링되어 시트가 닫혀 있어도 HTML에 포함된다.
export function GameGuide({ id }: { id: GameType }) {
  const game = GAMES.find((g) => g.id === id)!
  const seo = GAME_SEO[id]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd(id)) }}
      />
      <GuideSheet label={`${game.name} 하는 방법`}>
        <section aria-labelledby={`guide-${id}`} className="font-jua text-gray-600">
          <h2 id={`guide-${id}`} className="text-xl sm:text-2xl text-gray-800 mb-3">
            {game.emoji} {game.name} 하는 방법
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">{seo.intro}</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm sm:text-base leading-relaxed mb-6">
            {seo.howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h2 className="text-lg sm:text-xl text-gray-800 mb-2">자주 묻는 질문</h2>
          <dl className="space-y-3 text-sm sm:text-base leading-relaxed">
            {seo.faq.map(({ q, a }) => (
              <div key={q}>
                <dt className="text-gray-700">Q. {q}</dt>
                <dd className="text-gray-500">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </GuideSheet>
    </>
  )
}
