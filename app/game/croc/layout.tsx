import { gameMetadata } from '@/lib/game-seo'
import { GameGuide } from '@/components/GameGuide'
import { GameTouchGuard } from '@/components/GameTouchGuard'

export const metadata = gameMetadata('croc')

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameGuide id="croc" />
      <GameTouchGuard />
    </>
  )
}
