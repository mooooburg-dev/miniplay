import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '숫자 룰렛 🎡 - 금지 숫자 미션 게임',
  description:
    '숫자를 하나씩 골라라! 금지 숫자를 고르면 벌칙. 온가족 함께 즐기는 무료 룰렛 미니게임.',
  alternates: { canonical: '/game/roulette' },
  openGraph: {
    title: '숫자 룰렛 🎡 | miniplay',
    description: '금지 숫자를 고르면 벌칙! 무료 룰렛 미니게임.',
    url: '/game/roulette',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
