import type { MetadataRoute } from 'next'
import { GAMES } from '@/types'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://miniplay.kr'

  const gamePages = GAMES.map((game) => ({
    url: `${baseUrl}${game.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: [`${baseUrl}/og/${game.id}`],
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      images: [`${baseUrl}/og-image.png`],
    },
    ...gamePages,
  ]
}
