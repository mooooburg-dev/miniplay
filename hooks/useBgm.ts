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
    const bpm = 140
    const beatSec = 60 / bpm
    const bars = 4
    const totalBeats = bars * 4
    const duration = totalBeats * beatSec
    const sr = ctx.sampleRate
    const len = Math.floor(sr * duration)
    const buffer = ctx.createBuffer(2, len, sr)
    const L = buffer.getChannelData(0)
    const R = buffer.getChannelData(1)

    // 멜로디 패턴 (음계: C D E F G A B)
    const scale = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3]
    // 경쾌한 멜로디 시퀀스 (scale index, -1 = rest)
    const melody = [
      0, 2, 4, 5, 4, 2, 3, 4,
      5, 7, 5, 4, 2, 0, 2, -1,
    ]
    // 베이스 패턴
    const bass = [0, 0, 5, 5, 3, 3, 4, 4]

    for (let i = 0; i < len; i++) {
      const t = i / sr
      const beat = t / beatSec

      // 멜로디 (삼각파, 부드러운 어택)
      const melIdx = Math.floor(beat) % melody.length
      const note = melody[melIdx]
      if (note >= 0) {
        const freq = scale[note]
        const beatPos = (beat % 1)
        // 부드러운 엔벨로프
        const env = Math.min(1, beatPos * 12) * Math.max(0, 1 - beatPos * 1.3)
        // 삼각파
        const phase = (t * freq) % 1
        const tri = 4 * Math.abs(phase - 0.5) - 1
        L[i] += tri * env * 0.12
        R[i] += tri * env * 0.12
      }

      // 고음 하모니 (한 옥타브 위, 작은 볼륨)
      const harmIdx = Math.floor(beat / 2) % melody.length
      const harmNote = melody[harmIdx]
      if (harmNote >= 0) {
        const freq = scale[harmNote] * 2
        const beatPos = ((beat / 2) % 1)
        const env = Math.min(1, beatPos * 8) * Math.max(0, 1 - beatPos * 0.8)
        const phase = (t * freq) % 1
        const sine = Math.sin(phase * Math.PI * 2)
        L[i] += sine * env * 0.04
        R[i] += sine * env * 0.04
      }

      // 베이스 (사인파, 낮은 옥타브)
      const bassIdx = Math.floor(beat / 2) % bass.length
      const bassNote = bass[bassIdx]
      const bassFreq = scale[bassNote] / 2
      const bassEnv = Math.min(1, ((beat / 2) % 1) * 10) * Math.max(0, 1 - ((beat / 2) % 1) * 0.6)
      const bassSine = Math.sin((t * bassFreq) % 1 * Math.PI * 2)
      L[i] += bassSine * bassEnv * 0.10
      R[i] += bassSine * bassEnv * 0.10

      // 간단한 퍼커션 (킥 + 하이햇 느낌)
      const subBeat = beat % 1
      if (subBeat < 0.05) {
        // 킥 (저주파 버스트)
        const kickEnv = 1 - subBeat / 0.05
        const kickFreq = 80 * (1 + kickEnv * 2)
        const kick = Math.sin(t * kickFreq * Math.PI * 2) * kickEnv * 0.12
        L[i] += kick
        R[i] += kick
      }
      if (Math.floor(beat * 2) % 2 === 1 && (beat * 2 % 1) < 0.03) {
        // 하이햇 (노이즈)
        const hhEnv = 1 - (beat * 2 % 1) / 0.03
        const hh = (Math.random() * 2 - 1) * hhEnv * 0.06
        L[i] += hh
        R[i] += hh
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
