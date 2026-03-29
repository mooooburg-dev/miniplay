export type GameType = 'roulette' | 'croc' | 'bomb' | 'balloon' | 'mole'

export interface GameMeta {
  id: GameType
  emoji: string
  name: string
  desc: string
  color: string       // text/accent color
  shadow: string      // box-shadow color
  path: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'roulette',
    emoji: '🎡',
    name: '숫자 룰렛',
    desc: '금지 숫자 or 숫자 미션!',
    color: '#ff6b9d',
    shadow: '#ffb3cc',
    path: '/game/roulette',
  },
  {
    id: 'croc',
    emoji: '🐊',
    name: '악어 이빨',
    desc: '위험한 이빨을 뽑으면 벌칙!',
    color: '#27ae60',
    shadow: '#a8e6cf',
    path: '/game/croc',
  },
  {
    id: 'mole',
    emoji: '🐹',
    name: '쏙쏙 햄찌',
    desc: '쏙쏙 올라오는 햄찌를 잡아라!',
    color: '#e74c3c',
    shadow: '#f5a5a5',
    path: '/game/mole',
  },
  {
    id: 'bomb',
    emoji: '💣',
    name: '째깍 폭탄',
    desc: '폭발할 때 들고 있으면 벌칙!',
    color: '#e67e22',
    shadow: '#ffd6a5',
    path: '/game/bomb',
  },
  {
    id: 'balloon',
    emoji: '🎈',
    name: '풍선 팡',
    desc: '풍선을 터뜨리면 벌칙!',
    color: '#7b61ff',
    shadow: '#c9b8ff',
    path: '/game/balloon',
  },
]
