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
      className="px-7 py-2.5 rounded-full text-xl text-center font-jua bg-white mb-2.5 transition-all duration-300"
      style={{ boxShadow: `0 4px 0 ${shadowColor}`, color }}
    >
      🌟 {playerName} 차례!
    </div>
  )
}
