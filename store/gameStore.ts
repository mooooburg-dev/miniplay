import { create } from 'zustand'
import type { GameType } from '@/types'

interface GameState {
  players: string[]
  scores: number[]
  turn: number
  currentGame: GameType | null

  // Player management
  addPlayer: () => void
  addPlayerByName: (name: string) => void
  removePlayer: (index: number) => void
  updatePlayerName: (index: number, name: string) => void
  resetScores: () => void

  // Turn management
  nextTurn: () => void
  resetTurn: () => void

  // Game tracking
  setCurrentGame: (game: GameType | null) => void
  addPenalty: (playerIndex: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  scores: [],
  turn: 0,
  currentGame: null,

  addPlayer: () =>
    set((s) => {
      if (s.players.length >= 6) return s
      return {
        players: [...s.players, `플레이어${s.players.length + 1}`],
        scores: [...s.scores, 0],
      }
    }),

  addPlayerByName: (name) =>
    set((s) => {
      if (s.players.length >= 6) return s
      if (s.players.includes(name)) return s
      return {
        players: [...s.players, name],
        scores: [...s.scores, 0],
      }
    }),

  removePlayer: (index) =>
    set((s) => {
      if (s.players.length <= 0) return s
      const players = s.players.filter((_, i) => i !== index)
      const scores = s.scores.filter((_, i) => i !== index)
      return {
        players,
        scores,
        turn: s.turn >= players.length ? 0 : s.turn,
      }
    }),

  updatePlayerName: (index, name) =>
    set((s) => {
      const players = [...s.players]
      if (name.trim()) players[index] = name.trim()
      return { players }
    }),

  resetScores: () =>
    set((s) => ({ scores: s.players.map(() => 0) })),

  nextTurn: () =>
    set((s) => ({ turn: (s.turn + 1) % s.players.length })),

  resetTurn: () => set({ turn: 0 }),

  setCurrentGame: (game) => set({ currentGame: game }),

  addPenalty: (playerIndex) =>
    set((s) => {
      const scores = [...s.scores]
      scores[playerIndex] = (scores[playerIndex] ?? 0) + 1
      return { scores }
    }),
}))
