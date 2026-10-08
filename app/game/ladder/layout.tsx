import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '사다리 게임 🪜 - 사다리 타기로 운명 결정',
  description:
    '참여자와 결과를 적고 사다리를 타라! 당첨, 꽝, 벌칙, 순서 정하기까지. 온가족 함께하는 무료 사다리 타기 게임.',
  alternates: { canonical: '/game/ladder' },
  openGraph: {
    title: '사다리 게임 🪜 | miniplay',
    description: '사다리를 만들고 운명을 결정! 무료 사다리 타기 게임.',
    url: '/game/ladder',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
