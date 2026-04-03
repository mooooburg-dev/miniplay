import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '째깍 폭탄 💣 - 폭발하면 벌칙',
  description:
    '째깍째깍 타이머가 울리는 폭탄 돌리기! 폭발할 때 들고 있으면 벌칙. 온가족 긴장감 넘치는 무료 미니게임.',
  alternates: { canonical: '/game/bomb' },
  openGraph: {
    title: '째깍 폭탄 💣 | miniplay',
    description: '폭탄 돌리기! 폭발하면 벌칙. 긴장감 넘치는 무료 미니게임.',
    url: '/game/bomb',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
