import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '풍선 팡 🎈 - 풍선을 터뜨리면 벌칙',
  description:
    '풍선을 꾹꾹 눌러 부풀려라! 터뜨리는 사람이 벌칙. 온가족 두근두근 무료 미니게임.',
  alternates: { canonical: '/game/balloon' },
  openGraph: {
    title: '풍선 팡 🎈 | miniplay',
    description: '풍선을 터뜨리면 벌칙! 두근두근 무료 미니게임.',
    url: '/game/balloon',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
