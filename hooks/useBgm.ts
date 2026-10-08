'use client'
import { useRef, useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { BGM_TRACKS } from '@/lib/bgm-tracks'
import { renderTrack } from '@/lib/bgm-synth'
import type { BgmRenderRequest, BgmRenderResponse } from '@/workers/bgm.worker'

interface BgmState {
  playing: boolean
  trackName: string
  toggle: () => void
  setPlaying: (v: boolean) => void
  setTrackName: (name: string) => void
}

export const useBgmStore = create<BgmState>((set) => ({
  playing: true,
  trackName: '',
  toggle: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (v) => set({ playing: v }),
  setTrackName: (name) => set({ trackName: name }),
}))

const VOLUME = 0.45
const SWITCH_FADE = 1.6 // s — 화면 전환 시 크로스페이드
const TOGGLE_FADE = 0.5 // s — 켜기/끄기
const FIRST_FADE = 1.0 // s — 첫 재생

const WORKER_TIMEOUT = 4000 // ms — Worker 응답이 없으면 메인 스레드에서 합성

interface Voice {
  source: AudioBufferSourceNode
  gain: GainNode
  index: number
  fadeInStart: number // AudioContext 시각
  fadeInEnd: number
}

interface RenderRequest {
  resolve: (r: Pick<BgmRenderResponse, 'left' | 'right'>) => void
  fallback: () => void // 메인 스레드에서 다시 합성
  cancel: () => void // 요청 취소 (promise reject)
  timer: ReturnType<typeof setTimeout>
}

function randomTrackIndex(exclude: number | null): number {
  if (BGM_TRACKS.length <= 1) return 0
  let index: number
  do {
    index = Math.floor(Math.random() * BGM_TRACKS.length)
  } while (index === exclude)
  return index
}

/**
 * Web Audio API 기반 BGM 엔진.
 * - 곡 10개 중 하나를 랜덤 재생, sceneKey(경로)가 바뀌면 다른 곡으로 크로스페이드
 * - 곡 합성은 Web Worker에서 처리 (실패 시 메인 스레드)
 * - 메모리 절약을 위해 현재 곡과 다음 곡 버퍼만 유지
 * - 브라우저 정책상 첫 사용자 인터랙션 이후에만 재생
 */
export function useBgm(sceneKey: string) {
  const playing = useBgmStore((s) => s.playing)

  const acRef = useRef<AudioContext | null>(null)
  const unlockedRef = useRef(false)
  const voiceRef = useRef<Voice | null>(null)
  const nextIndexRef = useRef<number | null>(null)
  // 재생/전환 요청 세대 번호: 비동기 렌더링 중 더 새로운 요청이 오면 이전 결과는 버린다
  const genRef = useRef(0)

  const buffersRef = useRef(new Map<number, AudioBuffer>())
  const pendingRef = useRef(new Map<number, Promise<AudioBuffer>>())
  const workerRef = useRef<Worker | null>(null)
  const workerFailedRef = useRef(false)
  const requestIdRef = useRef(0)
  const resolversRef = useRef(new Map<number, RenderRequest>())

  const getAC = useCallback((): AudioContext => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)()
    }
    return acRef.current
  }, [])

  const getWorker = useCallback((): Worker | null => {
    if (workerFailedRef.current || typeof Worker === 'undefined') return null
    if (workerRef.current) return workerRef.current
    try {
      const worker = new Worker(new URL('../workers/bgm.worker.ts', import.meta.url))
      worker.onmessage = (e: MessageEvent<BgmRenderResponse>) => {
        const entry = resolversRef.current.get(e.data.id)
        if (!entry) return
        resolversRef.current.delete(e.data.id)
        clearTimeout(entry.timer)
        entry.resolve(e.data)
      }
      worker.onerror = () => {
        // Worker를 쓸 수 없으면 대기 중인 요청은 메인 스레드 렌더링으로 넘긴다
        workerFailedRef.current = true
        worker.terminate()
        workerRef.current = null
        const entries = [...resolversRef.current.values()]
        resolversRef.current.clear()
        entries.forEach((entry) => {
          clearTimeout(entry.timer)
          entry.fallback()
        })
      }
      workerRef.current = worker
      return worker
    } catch {
      workerFailedRef.current = true
      return null
    }
  }, [])

  const renderOnMainThread = useCallback((index: number, sampleRate: number) => {
    const { left, right } = renderTrack(BGM_TRACKS[index], sampleRate)
    return { left, right, sampleRate }
  }, [])

  const loadBuffer = useCallback(
    (index: number): Promise<AudioBuffer> => {
      const cached = buffersRef.current.get(index)
      if (cached) return Promise.resolve(cached)
      const pending = pendingRef.current.get(index)
      if (pending) return pending

      const ctx = getAC()
      const sampleRate = ctx.sampleRate
      const rendered = new Promise<Pick<BgmRenderResponse, 'left' | 'right'>>((resolve, reject) => {
        const fallback = () => {
          try {
            resolve(renderOnMainThread(index, sampleRate))
          } catch (error) {
            reject(error)
          }
        }
        const worker = getWorker()
        if (!worker) {
          fallback()
          return
        }
        const id = ++requestIdRef.current
        const timer = setTimeout(() => {
          // Worker가 응답하지 않으면 메인 스레드에서 합성
          if (resolversRef.current.delete(id)) fallback()
        }, WORKER_TIMEOUT)
        resolversRef.current.set(id, { resolve, fallback, cancel: () => reject(new Error('cancelled')), timer })
        const request: BgmRenderRequest = { id, index, sampleRate }
        worker.postMessage(request)
      })

      const promise = rendered
        .then(({ left, right }) => {
          const buffer = ctx.createBuffer(2, left.length, sampleRate)
          buffer.getChannelData(0).set(left)
          buffer.getChannelData(1).set(right)
          buffersRef.current.set(index, buffer)
          return buffer
        })
        .finally(() => pendingRef.current.delete(index))
      pendingRef.current.set(index, promise)
      return promise
    },
    [getAC, getWorker, renderOnMainThread],
  )

  /** 현재 곡과 다음 곡 외의 버퍼는 해제 (곡 하나에 수 MB) */
  const trimBuffers = useCallback(() => {
    const keep = new Set([voiceRef.current?.index, nextIndexRef.current])
    for (const index of buffersRef.current.keys()) {
      if (!keep.has(index)) buffersRef.current.delete(index)
    }
  }, [])

  /** 다음 곡을 미리 정해 렌더링해 둔다 (전환 시 끊김 방지) */
  const prepareNext = useCallback(() => {
    const index = randomTrackIndex(voiceRef.current?.index ?? null)
    nextIndexRef.current = index
    trimBuffers()
    loadBuffer(index).catch(() => {})
  }, [loadBuffer, trimBuffers])

  const fadeOut = useCallback((voice: Voice, fade: number) => {
    const ctx = acRef.current
    if (!ctx) return
    const now = ctx.currentTime
    const gain = voice.gain.gain
    // 페이드인 도중이면 현재 음량에서 이어서 줄인다.
    // (gain.value는 브라우저마다 자동화 값을 반영하지 않을 수 있어 직접 계산)
    if (typeof gain.cancelAndHoldAtTime === 'function') {
      gain.cancelAndHoldAtTime(now)
    } else {
      const progress = Math.min(1, Math.max(0, (now - voice.fadeInStart) / Math.max(0.001, voice.fadeInEnd - voice.fadeInStart)))
      gain.cancelScheduledValues(now)
      gain.setValueAtTime(VOLUME * progress, now)
    }
    gain.linearRampToValueAtTime(0, now + fade)
    voice.source.onended = () => {
      voice.source.disconnect()
      voice.gain.disconnect()
    }
    try {
      voice.source.stop(now + fade + 0.05)
    } catch {}
  }, [])

  const startVoice = useCallback((index: number, buffer: AudioBuffer, fade: number) => {
    const ctx = getAC()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(VOLUME, now + fade)
    gain.connect(ctx.destination)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(gain)
    source.start()

    voiceRef.current = { source, gain, index, fadeInStart: now, fadeInEnd: now + fade }
    useBgmStore.getState().setTrackName(BGM_TRACKS[index].name)
  }, [getAC])

  /** 다음 곡으로 전환한다. 재생 중인 곡이 있으면 크로스페이드 */
  const playNext = useCallback(
    async (fade: number) => {
      const gen = ++genRef.current
      if (!unlockedRef.current || !useBgmStore.getState().playing) return

      // 미리 정해 둔 다음 곡은 실제로 재생을 시작할 때 prepareNext()에서 교체된다
      // (도중에 취소되면 다음 요청이 같은 곡과 렌더링 결과를 그대로 쓴다)
      const index = nextIndexRef.current ?? randomTrackIndex(voiceRef.current?.index ?? null)
      let buffer: AudioBuffer
      try {
        buffer = await loadBuffer(index)
      } catch {
        return
      }
      if (gen !== genRef.current || !useBgmStore.getState().playing) return

      const previous = voiceRef.current
      if (previous) fadeOut(previous, fade)
      startVoice(index, buffer, fade)
      prepareNext()
    },
    [loadBuffer, fadeOut, startVoice, prepareNext],
  )

  const stop = useCallback(
    (fade: number) => {
      genRef.current++
      const voice = voiceRef.current
      voiceRef.current = null
      if (voice) fadeOut(voice, fade)
      useBgmStore.getState().setTrackName('')
    },
    [fadeOut],
  )

  // 켜기/끄기
  useEffect(() => {
    if (playing) {
      if (!voiceRef.current) playNext(TOGGLE_FADE)
    } else {
      stop(TOGGLE_FADE)
    }
  }, [playing, playNext, stop])

  // 화면(경로)이 바뀌면 다른 곡으로 크로스페이드
  const prevSceneRef = useRef(sceneKey)
  useEffect(() => {
    if (prevSceneRef.current === sceneKey) return
    prevSceneRef.current = sceneKey
    if (voiceRef.current) playNext(SWITCH_FADE)
  }, [sceneKey, playNext])

  // 브라우저 정책: 사용자 활성화(user activation) 전에는 오디오 재생이 막혀 있다.
  // 모바일 터치에서는 touchend/click만 활성화로 인정되므로 리스너를 계속 유지하고,
  // 제스처마다 멈춘 AudioContext를 깨운다. (iOS의 전화·다른 앱 오디오·음성 인식으로 인한 중단 복구 포함)
  useEffect(() => {
    const events = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown'] as const
    const onGesture = () => {
      const isFirst = !unlockedRef.current
      unlockedRef.current = true
      const ctx = getAC()
      if (ctx.state !== 'running' && ctx.state !== 'closed' && document.visibilityState === 'visible') {
        ctx.resume().catch(() => {})
      }
      if (isFirst && useBgmStore.getState().playing && !voiceRef.current) playNext(FIRST_FADE)
    }
    events.forEach((e) => document.addEventListener(e, onGesture, { passive: true }))
    return () => events.forEach((e) => document.removeEventListener(e, onGesture))
  }, [getAC, playNext])

  // 탭이 숨겨지면 일시정지 (모바일 배터리 절약), 다시 보이면 재개
  useEffect(() => {
    const onVisibility = () => {
      const ctx = acRef.current
      if (!ctx || ctx.state === 'closed') return
      if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {})
      else if (voiceRef.current) ctx.resume().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // 언마운트 시 정리
  useEffect(() => {
    const resolvers = resolversRef.current
    const pending = pendingRef.current
    return () => {
      stop(0.05)
      workerRef.current?.terminate()
      workerRef.current = null
      // 대기 중인 합성 요청을 취소해 promise가 영원히 남지 않게 한다
      resolvers.forEach((entry) => {
        clearTimeout(entry.timer)
        entry.cancel()
      })
      resolvers.clear()
      pending.clear()
    }
  }, [stop])
}
