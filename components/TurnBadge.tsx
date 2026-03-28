interface TurnBadgeProps {
  playerName: string
  color?: string
  shadowColor?: string
}

export function TurnBadge({
  playerName,
  color = '#ff6b9d',
  shadowColor = '#ffb3cc',
}: TurnBadgeProps) {
  return (
    <div
      className="px-8 py-3 rounded-full text-2xl text-center font-jua bg-white/90 backdrop-blur-md mb-5 transition-all duration-300 border border-white/80 animate-pulse-glow"
      style={{
        color,
        boxShadow: `0 8px 24px ${shadowColor}60, inset 0 2px 4px rgba(255,255,255,1)`,
      }}
    >
      <span className="inline-block animate-wiggle mr-1.5 origin-bottom">🌟</span>
      {playerName} 차례!
    </div>
  )
}
