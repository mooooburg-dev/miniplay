'use client'
import { useRef, useCallback, useEffect } from 'react'
import { create } from 'zustand'

interface BgmState {
  playing: boolean
  toggle: () => void
  setPlaying: (v: boolean) => void
}

export const useBgmStore = create<BgmState>((set) => ({
  playing: false,
  toggle: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (v) => set({ playing: v }),
}))

/**
 * Web Audio API 기반 BGM 엔진.
 * 앱 전체에서 하나의 AudioContext를 공유하며,
 * useBgmStore.playing 상태에 따라 재생/정지한다.
 */
export function useBgm() {
  const acRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const playing = useBgmStore((s) => s.playing)

  const getAC = useCallback((): AudioContext => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)()
    }
    return acRef.current
  }, [])

  // BGM 패턴을 AudioBuffer로 생성 (한 번만)
  const buildBuffer = useCallback(() => {
    if (bufferRef.current) return bufferRef.current
    const ctx = getAC()
    const bpm = 160
    const beatSec = 60 / bpm
    const bars = 8
    const totalBeats = bars * 4
    const duration = totalBeats * beatSec
    const sr = ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = ctx.createBuffer(2, len, sr)
    const L = buffer.getChannelData(0)
    const R = buffer.getChannelData(1)

    // C 메이저 스케일 주파수
    const C4 = 261.6, D4 = 293.7, E4 = 329.6, F4 = 349.2
    const G4 = 392.0, A4 = 440.0, B4 = 493.9, C5 = 523.3
    const D5 = 587.3, E5 = 659.3, G5 = 784.0

    // 8마디 멜로디 (8분음표 단위, 총 64스텝)
    const mel: (number | -1)[] = [
      C5, E5, G5, E5, D5, C5, D5, E5,
      G4, A4, B4, C5, D5, E5, D5, C5,
      E5, -1, G5, E5, D5, -1, C5, D5,
      E5, D5, C5, B4, A4, G4, A4, -1,
      C5, D5, E5, G5, E5, D5, C5, E5,
      G4, -1, B4, -1, D5, -1, G5, -1,
      E5, G5, E5, D5, C5, D5, E5, G5,
      D5, C5, B4, A4, G4, -1, -1, -1,
    ]

    // 베이스 (비트 단위, 32스텝)
    const bassNotes = [
      C4/2, C4/2, C4/2, G4/2,
      A4/2, A4/2, A4/2, E4/2,
      F4/2, F4/2, F4/2, C4/2,
      G4/2, G4/2, G4/2, G4/2,
      C4/2, C4/2, C4/2, G4/2,
      A4/2, A4/2, A4/2, E4/2,
      F4/2, F4/2, G4/2, G4/2,
      C4/2, C4/2, G4/2, C4/2,
    ]

    // 코드 (2비트마다) - 아르페지오용
    const chords: number[][] = [
      [C4, E4, G4], [C4, E4, G4], [A4/2*2, C4, E4], [A4/2*2, C4, E4],
      [F4, A4, C5], [F4, A4, C5], [G4, B4, D5], [G4, B4, D5],
      [C4, E4, G4], [C4, E4, G4], [A4/2*2, C4, E4], [A4/2*2, C4, E4],
      [F4, A4, C5], [G4, B4, D5], [C4, E4, G4], [C4, E4, G4],
    ]

    for (let i = 0; i < len; i++) {
      const t = i / sr
      const beat = t / beatSec
      const eighthBeat = beat * 2

      // === 메인 멜로디 (사각파+삼각파 믹스) ===
      const melStep = Math.floor(eighthBeat) % mel.length
      const freq = mel[melStep]
      if (freq > 0) {
        const pos = eighthBeat % 1
        const env = Math.min(1, pos * 20) * Math.max(0, 1 - pos * 0.9)
        const phase = (t * freq) % 1
        const tri = 4 * Math.abs(phase - 0.5) - 1
        const sq = phase < 0.5 ? 1 : -1
        const mix = tri * 0.7 + sq * 0.3
        L[i] += mix * env * 0.10
        R[i] += mix * env * 0.10
      }

      // === 아르페지오 (16분음표, 스테레오 핑퐁) ===
      const chordIdx = Math.floor(beat / 2) % chords.length
      const chord = chords[chordIdx]
      const arpStep = Math.floor(beat * 4) % 4
      const arpNote = chord[arpStep % chord.length]
      const arpFreq = arpNote * 2
      const arpPos = (beat * 4) % 1
      const arpEnv = Math.min(1, arpPos * 30) * Math.max(0, 1 - arpPos * 1.5)
      const arpSine = Math.sin((t * arpFreq) % 1 * Math.PI * 2)
      const arpVol = arpEnv * 0.045
      if (arpStep % 2 === 0) {
        L[i] += arpSine * arpVol * 1.3
        R[i] += arpSine * arpVol * 0.5
      } else {
        L[i] += arpSine * arpVol * 0.5
        R[i] += arpSine * arpVol * 1.3
      }

      // === 펑키 베이스 (옥타브 점프) ===
      const bassIdx = Math.floor(beat) % bassNotes.length
      const bassFreq = bassNotes[bassIdx]
      const bassPos = beat % 1
      const isGhost = bassPos >= 0.5
      const bFreq = isGhost ? bassFreq * 2 : bassFreq
      const bVol = isGhost ? 0.06 : 0.11
      const bPos = isGhost ? (bassPos - 0.5) * 2 : bassPos * 2
      const bassEnv = Math.min(1, bPos * 18) * Math.max(0, 1 - bPos * 0.7)
      const bassSig = Math.sin((t * bFreq) % 1 * Math.PI * 2)
      L[i] += bassSig * bassEnv * bVol
      R[i] += bassSig * bassEnv * bVol

      // === 드럼 패턴 ===
      const beatInBar = beat % 4
      const subBeat = beat % 1
      const sixteenth = (beat * 4) % 1

      // 킥
      const isKick = subBeat < 0.06 && (
        Math.floor(beatInBar) === 0 ||
        Math.floor(beatInBar) === 2 ||
        (Math.floor(beatInBar) === 3 && beat * 4 % 4 >= 3.5)
      )
      if (isKick) {
        const kPos = subBeat / 0.06
        const kEnv = (1 - kPos) * (1 - kPos)
        const kick = Math.sin(t * 55 * (1 + kEnv * 3) * Math.PI * 2) * kEnv * 0.18
        L[i] += kick
        R[i] += kick
      }

      // 스네어
      const isSnare = subBeat < 0.07 && (
        Math.floor(beatInBar) === 1 || Math.floor(beatInBar) === 3
      )
      if (isSnare) {
        const sEnv = 1 - subBeat / 0.07
        L[i] += (Math.random() * 2 - 1) * sEnv * 0.13 + Math.sin(t * 180 * Math.PI * 2) * sEnv * 0.08
        R[i] += (Math.random() * 2 - 1) * sEnv * 0.13 + Math.sin(t * 180 * Math.PI * 2) * sEnv * 0.08
      }

      // 하이햇 (오프비트에 오픈)
      if ((eighthBeat % 1) < 0.04) {
        const isOpen = Math.floor(eighthBeat) % 2 === 1
        const hhEnv = Math.max(0, 1 - (eighthBeat % 1) / (isOpen ? 0.04 : 0.015))
        const hh = (Math.random() * 2 - 1) * hhEnv * 0.07
        L[i] += hh * 0.7
        R[i] += hh * 1.2
      }

      // 쉐이커 (16분음표)
      if (sixteenth < 0.03) {
        const sh = (Math.random() * 2 - 1) * (1 - sixteenth / 0.03) * 0.025
        L[i] += sh * 1.3
        R[i] += sh * 0.6
      }
    }

    bufferRef.current = buffer
    return buffer
  }, [getAC])

  const startPlayback = useCallback(() => {
    const ctx = getAC()
    if (ctx.state === 'suspended') ctx.resume()

    // 이미 재생 중이면 스킵
    if (sourceRef.current) return

    const buffer = buildBuffer()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.value = 0.5
    gainRef.current = gain

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    sourceRef.current = source
  }, [getAC, buildBuffer])

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
  }, [])

  // playing 상태 변화에 따라 재생/정지
  useEffect(() => {
    if (playing) {
      startPlayback()
    } else {
      stopPlayback()
    }
    return () => {
      stopPlayback()
    }
  }, [playing, startPlayback, stopPlayback])
}
