import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  // 추후 miniplay.kr 도메인 연결 시 별도 설정 불필요
}

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  // 국기 SVG(약 850KB)는 precache 대신 런타임 이미지 캐시로 처리
  publicExcludes: ['!noprecache/**/*', '!flags/**/*'],
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        // 국기는 바뀌지 않으므로 CacheFirst, 기본 이미지 캐시(64개)와 분리
        // 국기 SVG를 교체하면 cacheName 버전을 올려 기존 캐시를 무효화할 것
        urlPattern: /\/flags\/[a-z]{2}\.svg$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'flag-images',
          expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig)
