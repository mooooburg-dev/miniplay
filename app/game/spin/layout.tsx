import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '화살표 스핀 👉 - 화살표가 가리키면 당첨',
  description:
    '돌아가는 화살표가 멈추면 당첨! 벌칙 정하기, 순서 정하기에 딱 맞는 무료 스핀 게임.',
  alternates: { canonical: '/game/spin' },
  openGraph: {
    title: '화살표 스핀 👉 | miniplay',
    description: '화살표가 가리키면 당첨! 무료 스핀 게임.',
    url: '/game/spin',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
