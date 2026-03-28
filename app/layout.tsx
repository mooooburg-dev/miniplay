import type { Metadata } from 'next'
import { Jua } from 'next/font/google'
import './globals.css'

const jua = Jua({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-jua',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '미니게임 모음 🎮 | miniplay',
  description: '온가족 함께하는 두근두근 벌칙 게임! 악어이빨, 째깍폭탄, 풍선팡, 숫자룰렛',
  keywords: ['미니게임', '가족게임', '벌칙게임', '아이와 함께', '파티게임'],
  openGraph: {
    title: '미니게임 모음 🎮',
    description: '온가족 함께하는 두근두근 벌칙 게임!',
    url: 'https://miniplay.kr',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={jua.variable}>
      <body className="font-jua">{children}</body>
    </html>
  )
}
