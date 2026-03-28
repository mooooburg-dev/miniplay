import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Jua } from 'next/font/google'
import { GA_ID } from '@/lib/gtag'
import { BgmToggle } from '@/components/BgmToggle'
import './globals.css'

const jua = Jua({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-jua',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '미니게임 모음 🎮 | miniplay',
  description: '온가족 함께하는 두근두근 벌칙 게임! 악어이빨, 째깍폭탄, 풍선팡, 숫자룰렛',
  keywords: ['미니게임', '가족게임', '벌칙게임', '아이와 함께', '파티게임'],
  openGraph: {
    title: '미니게임 모음 🎮',
    description: '온가족 함께하는 두근두근 벌칙 게임!',
    url: 'https://miniplay.kr',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '미니게임 모음',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={jua.variable}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="font-jua">
        <BgmToggle />
        {children}
      </body>
    </html>
  )
}
