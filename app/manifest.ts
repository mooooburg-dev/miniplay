import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '미니게임 모음',
    short_name: '미니게임 모음',
    description: '온가족 함께하는 두근두근 벌칙 미니게임 모음',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a1a',
    theme_color: '#e94560',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
