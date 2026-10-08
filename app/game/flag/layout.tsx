import { gameMetadata } from '@/lib/game-seo'
import { GameGuide } from '@/components/GameGuide'
import { GameTouchGuard } from '@/components/GameTouchGuard'

export const metadata = gameMetadata('flag')

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameGuide id="flag" />
      <GameTouchGuard />
    </>
  )
}
