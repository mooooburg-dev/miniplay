export type GameType =
  | 'roulette'
  | 'croc'
  | 'bomb'
  | 'balloon'
  | 'mole'
  | 'spin'
  | 'ladder';

export interface GameMeta {
  id: GameType;
  emoji: string;
  name: string;
  desc: string;
  color: string; // text/accent color
  shadow: string; // box-shadow color
  path: string;
  isNew?: boolean;
}

export const GAMES: GameMeta[] = [
  {
    id: 'ladder',
    emoji: '🪜',
    name: '사다리 게임',
    desc: '사다리를 만들고 운명을 결정!',
    color: '#f59e0b',
    shadow: '#fcd34d',
    path: '/game/ladder',
    isNew: true,
  },
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
    id: 'spin',
    emoji: '👉',
    name: '화살표 스핀',
    desc: '화살표가 가리키면 당첨!',
    color: '#e91e63',
    shadow: '#f48fb1',
    path: '/game/spin',
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
];
