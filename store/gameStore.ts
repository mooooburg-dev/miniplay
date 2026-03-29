import { create } from 'zustand'
import type { GameType } from '@/types'

const STORAGE_KEY = 'miniplay-players'

function loadPlayers(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return []
}

function savePlayers(players: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch {}
}

interface GameState {
  players: string[]
  scores: number[]
  turn: number
  currentGame: GameType | null
  _hydrated: boolean

  // Hydration
  hydrate: () => void

  // Player management
  addPlayer: () => void
  addPlayerByName: (name: string) => void
  removePlayer: (index: number) => void
  updatePlayerName: (index: number, name: string) => void
  resetScores: () => void

  // Player order
  swapPlayers: (i: number, j: number) => void

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
  _hydrated: false,

  hydrate: () => {
    if (get()._hydrated) return
    const saved = loadPlayers()
    if (saved.length > 0) {
      set({ players: saved, scores: saved.map(() => 0), _hydrated: true })
    } else {
      set({ _hydrated: true })
    }
  },

  addPlayer: () =>
    set((s) => {
      if (s.players.length >= 6) return s
      const players = [...s.players, `플레이어${s.players.length + 1}`]
      savePlayers(players)
      return {
        players,
        scores: [...s.scores, 0],
      }
    }),

  addPlayerByName: (name) =>
    set((s) => {
      if (s.players.length >= 6) return s
      if (s.players.includes(name)) return s
      const players = [...s.players, name]
      savePlayers(players)
      return {
        players,
        scores: [...s.scores, 0],
      }
    }),

  removePlayer: (index) =>
    set((s) => {
      if (s.players.length <= 0) return s
      const players = s.players.filter((_, i) => i !== index)
      const scores = s.scores.filter((_, i) => i !== index)
      savePlayers(players)
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
      savePlayers(players)
      return { players }
    }),

  resetScores: () =>
    set((s) => ({ scores: s.players.map(() => 0) })),

  swapPlayers: (i, j) =>
    set((s) => {
      if (i < 0 || j < 0 || i >= s.players.length || j >= s.players.length) return s
      const players = [...s.players]
      const scores = [...s.scores]
      ;[players[i], players[j]] = [players[j], players[i]]
      ;[scores[i], scores[j]] = [scores[j], scores[i]]
      savePlayers(players)
      return { players, scores }
    }),

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
