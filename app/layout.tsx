import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Jua } from 'next/font/google'
import { GA_ID } from '@/lib/gtag'
import { BgmToggle } from '@/components/BgmToggle'
import { NotificationToggle } from '@/components/NotificationToggle'
import { PwaTracker } from '@/components/PwaTracker'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
  metadataBase: new URL('https://miniplay.kr'),
  title: {
    default: '미니게임 모음 🎮 | miniplay - 온가족 무료 파티게임',
    template: '%s | miniplay',
  },
  description:
    '설치 없이 바로 플레이! 악어이빨, 째깍폭탄, 풍선팡, 숫자룰렛, 화살표스핀, 쏙쏙햄찌까지. 온가족 함께하는 두근두근 벌칙 미니게임 모음. 모바일·PC 모두 지원.',
  keywords: [
    '미니게임',
    '가족게임',
    '벌칙게임',
    '파티게임',
    '무료게임',
    '온라인미니게임',
    '아이와 함께',
    '브라우저게임',
    '모바일게임',
    '술자리게임',
    '악어이빨게임',
    '폭탄돌리기',
    'miniplay',
  ],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'miniplay',
    title: '미니게임 모음 🎮 | miniplay',
    description:
      '설치 없이 바로 플레이! 온가족 함께하는 두근두근 벌칙 미니게임 모음.',
    url: 'https://miniplay.kr',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'miniplay - 온가족 미니게임 모음',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '미니게임 모음 🎮 | miniplay',
    description:
      '설치 없이 바로 플레이! 온가족 함께하는 두근두근 벌칙 미니게임 모음.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://miniplay.kr',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '미니게임 모음',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      <body className="font-jua" suppressHydrationWarning>
        <PwaTracker />
        <NotificationToggle />
        <BgmToggle />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
