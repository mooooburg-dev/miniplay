import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '악어 이빨 🐊 - 위험한 이빨을 뽑으면 벌칙',
  description:
    '악어 이빨을 하나씩 눌러라! 위험한 이빨을 누르면 악어가 물어요. 온가족 스릴만점 무료 미니게임.',
  alternates: { canonical: '/game/croc' },
  openGraph: {
    title: '악어 이빨 🐊 | miniplay',
    description: '위험한 이빨을 누르면 벌칙! 스릴만점 무료 미니게임.',
    url: '/game/croc',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
