import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '쏙쏙 햄찌 🐹 - 올라오는 햄찌를 잡아라',
  description:
    '쏙쏙 올라오는 귀여운 햄찌를 빠르게 터치! 반응속도를 겨루는 온가족 무료 미니게임.',
  alternates: { canonical: '/game/mole' },
  openGraph: {
    title: '쏙쏙 햄찌 🐹 | miniplay',
    description: '올라오는 햄찌를 잡아라! 반응속도 무료 미니게임.',
    url: '/game/mole',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
