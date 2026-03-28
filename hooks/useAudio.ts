'use client'
import { useRef, useCallback } from 'react'

export function useAudio() {
  const acRef = useRef<AudioContext | null>(null)

  const getAC = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!acRef.current) {
      acRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)()
    }
    return acRef.current
  }, [])

  const tone = useCallback(
    (
      freq: number,
      type: OscillatorType,
      dur: number,
      vol: number,
      delay = 0,
      endFreq?: number,
    ) => {
      const ctx = getAC()
      if (!ctx) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = type
      o.frequency.setValueAtTime(freq, ctx.currentTime + delay)
      if (endFreq) {
        o.frequency.exponentialRampToValueAtTime(
          endFreq,
          ctx.currentTime + delay + dur * 0.85,
        )
      }
      g.gain.setValueAtTime(vol, ctx.currentTime + delay)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
      o.start(ctx.currentTime + delay)
      o.stop(ctx.currentTime + delay + dur + 0.02)
    },
    [getAC],
  )

  const noiseBurst = useCallback(
    (vol = 0.6, decay = 0.08) => {
      const ctx = getAC()
      if (!ctx) return
      const buf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * 0.3),
        ctx.sampleRate,
      )
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) {
        d[i] =
          (Math.random() * 2 - 1) *
          Math.exp(-i / (ctx.sampleRate * decay))
      }
      const src = ctx.createBufferSource()
      const g = ctx.createGain()
      g.gain.value = vol
      src.buffer = buf
      src.connect(g)
      g.connect(ctx.destination)
      src.start()
    },
    [getAC],
  )

  return {
    playClick: useCallback(() => tone(400, 'sine', 0.14, 0.28, 0, 800), [tone]),
    playTick: useCallback(
      (pitch = 1) => tone(620 * pitch, 'sine', 0.09, 0.18, 0, 310 * pitch),
      [tone],
    ),
    playBeep: useCallback(
      (freq = 880) => tone(freq, 'square', 0.11, 0.13),
      [tone],
    ),
    playSafe: useCallback(() => {
      tone(523, 'triangle', 0.18, 0.18)
      tone(659, 'triangle', 0.18, 0.14, 0.14)
    }, [tone]),
    playDanger: useCallback(() => {
      tone(220, 'sawtooth', 0.07, 0.3)
      tone(165, 'sawtooth', 0.07, 0.3, 0.08)
      tone(110, 'sawtooth', 0.15, 0.3, 0.17)
    }, [tone]),
    playFanfare: useCallback(() => {
      ;[523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 'triangle', 0.33, 0.28, i * 0.11),
      )
      setTimeout(() => tone(1200, 'sine', 0.38, 0.18, 0, 2400), 460)
    }, [tone]),
    playPenalty: useCallback(() => {
      tone(300, 'square', 0.09, 0.18)
      tone(240, 'square', 0.09, 0.18, 0.11)
      tone(180, 'square', 0.18, 0.18, 0.22)
    }, [tone]),
    playPump: useCallback(
      () => tone(180, 'sine', 0.18, 0.18, 0, 400),
      [tone],
    ),
    playPop: useCallback(() => {
      noiseBurst(0.7, 0.06)
      tone(100, 'sawtooth', 0.4, 0.35, 0, 40)
    }, [noiseBurst, tone]),
    playBombTick: useCallback(() => tone(820, 'square', 0.05, 0.13), [tone]),
    playExplosion: useCallback(() => {
      noiseBurst(0.9, 0.12)
      tone(80, 'sawtooth', 0.6, 0.4, 0, 40)
    }, [noiseBurst, tone]),
  }
}
