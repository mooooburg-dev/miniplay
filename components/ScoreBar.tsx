interface ScoreBarProps {
  players: string[]
  scores: number[]
  currentTurn: number
  activeColor?: string
}

export function ScoreBar({
  players,
  scores,
  currentTurn,
  activeColor = '#ff6b9d',
}: ScoreBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center mb-3.5">
      {players.map((player, i) => (
        <span
          key={i}
          className="px-3.5 py-1 rounded-full text-xs font-jua transition-all duration-200"
          style={
            i === currentTurn
              ? { background: activeColor, color: 'white', transform: 'scale(1.08)' }
              : { background: 'rgba(255,255,255,0.6)', color: '#666' }
          }
        >
          {player} {scores[i] > 0 ? '💀'.repeat(Math.min(scores[i], 5)) : '😊'}
        </span>
      ))}
    </div>
  )
}
