import Link from 'next/link'
import { GAMES } from '@/types'

// 홈 하단 소개·추천·FAQ (Server Component) — 검색엔진이 읽을 본문 + FAQ JSON-LD

const SCENES = [
  { title: '벌칙 정하기', desc: '누가 설거지할까? 째깍 폭탄·풍선 팡·악어 이빨로 공정하게!', ids: ['bomb', 'balloon', 'croc'] },
  { title: '순서·당첨자 정하기', desc: '사다리 타기와 화살표 스핀이면 순서 정하기 끝.', ids: ['ladder', 'spin'] },
  { title: '아이와 놀며 배우기', desc: '국기 퀴즈로 세계 나라 이름을, 숫자 룰렛 미션으로 몸놀이를!', ids: ['flag', 'roulette'] },
  { title: '반응속도 대결', desc: '쏙쏙 햄찌를 누가 더 많이 잡을까? 가족 대항전!', ids: ['mole'] },
] as const

export const HOME_FAQ = [
  { q: '미니플레이는 무료인가요?', a: '네. 모든 게임이 완전 무료이고, 앱 설치나 회원가입 없이 브라우저에서 바로 플레이할 수 있어요.' },
  { q: '몇 명이서 할 수 있나요?', a: '참여자를 등록하지 않고 바로 해도 되고, 최대 6명까지 등록하면 대부분의 게임에서 차례와 벌칙 횟수가 자동으로 기록돼요.' },
  { q: '핸드폰과 태블릿에서도 되나요?', a: '스마트폰, 태블릿, PC 모두 지원해요. 홈 화면에 추가하면 앱처럼 쓸 수 있어요.' },
  { q: '아이들이 해도 괜찮은가요?', a: '부모님이 아이와 함께 하기 좋은 귀여운 게임들로 만들었어요. 벌칙은 가족끼리 정한 재미있는 미션으로 즐겨 주세요.' },
]

export function HomeAbout() {
  const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]))
  return (
    <section
      aria-labelledby="home-about"
      className="glass-card w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl mt-8 p-5 sm:p-7 font-jua text-gray-600"
    >
      <h2 id="home-about" className="text-xl sm:text-2xl text-[#ff6b9d] mb-3">
        온가족 벌칙 미니게임, 미니플레이
      </h2>
      <p className="text-sm sm:text-base leading-relaxed mb-5">
        미니플레이는 부모님과 아이가 함께 바로 즐기는 무료 벌칙 미니게임 모음이에요. 설치 없이 스마트폰 하나로
        국기 퀴즈, 사다리 타기, 폭탄 돌리기, 풍선 터뜨리기, 악어 이빨, 두더지 잡기, 숫자 룰렛, 화살표 돌리기를
        할 수 있어요. 가족 모임, 명절, 캠핑, 친구들과의 파티에서 벌칙이나 순서를 정할 때 써 보세요.
      </p>

      <h2 className="text-lg sm:text-xl text-[#ff6b9d] mb-2">이럴 때 추천해요</h2>
      <ul className="space-y-2 mb-5 text-sm sm:text-base">
        {SCENES.map((scene) => (
          <li key={scene.title}>
            <span className="text-gray-700">{scene.title}</span>
            <span className="text-gray-500"> — {scene.desc} </span>
            {scene.ids.map((id, i) => (
              <span key={id}>
                {i > 0 && ', '}
                <Link href={byId[id].path} className="underline underline-offset-2" style={{ color: byId[id].color }}>
                  {byId[id].name}
                </Link>
              </span>
            ))}
          </li>
        ))}
      </ul>

      <h2 className="text-lg sm:text-xl text-[#ff6b9d] mb-2">자주 묻는 질문</h2>
      <dl className="space-y-3 text-sm sm:text-base leading-relaxed">
        {HOME_FAQ.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-gray-700">Q. {q}</dt>
            <dd className="text-gray-500">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
