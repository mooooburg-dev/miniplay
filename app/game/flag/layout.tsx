import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '국기 퀴즈 🌍 - 세계 국기 보고 나라 맞히기',
  description:
    '이 국기는 어느 나라일까? 레벨 1~3 세계 국기 맞히기 퀴즈. 보기 터치 또는 말로 대답! 아이와 함께하는 무료 국기 게임.',
  alternates: { canonical: '/game/flag' },
  openGraph: {
    title: '국기 퀴즈 🌍 | miniplay',
    description: '세계 국기 보고 나라 맞히기! 무료 국기 퀴즈 게임.',
    url: '/game/flag',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
