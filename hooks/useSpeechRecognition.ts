'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API 최소 타입 (브라우저별 구현 차이로 lib.dom 타입 대신 직접 정의)
interface RecognitionAlternative {
  transcript: string
}
interface RecognitionResult extends ArrayLike<RecognitionAlternative> {
  isFinal: boolean
}
interface RecognitionResultEvent {
  results: ArrayLike<RecognitionResult>
}
interface RecognitionErrorEvent {
  error: string
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: RecognitionResultEvent) => void) | null
  onerror: ((e: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

/**
 * - not-allowed: 마이크 권한 거부 (계속 실패하므로 음성 대답을 막는다)
 * - unsupported: 인식기를 만들거나 시작할 수 없음 (계속 실패)
 * - no-speech: 아무 말도 인식되지 않음 (다시 시도)
 * - failed: 네트워크 등 일시적 오류 (다시 시도 가능)
 */
export type SpeechErrorType = 'not-allowed' | 'unsupported' | 'no-speech' | 'failed'

interface ListenHandlers {
  onResult: (transcripts: string[]) => void
  onError: (error: SpeechErrorType) => void
}

const SILENCE_TIMEOUT = 8000 // ms — 새 인식 결과가 없으면 종료 요청
const MAX_LISTEN = 15000 // ms — 소음으로 결과가 계속 들어와도 이 시간이 지나면 종료 요청
const STOP_GRACE = 1500 // ms — 종료 요청 후 엔진의 최종 결과를 기다리는 시간

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function toErrorType(error: string): SpeechErrorType {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'not-allowed'
  // aborted: 빠르게 다시 시작할 때 이전 인스턴스 정리 중 발생할 수 있어 재시도로 처리
  if (error === 'no-speech' || error === 'aborted') return 'no-speech'
  return 'failed'
}

/**
 * 한 번 말하면 결과를 돌려주는 음성 인식 훅
 * - finish(): 말하기 완료 → 엔진의 최종 결과를 받아 onResult 호출
 * - stop(): 취소 → 결과를 버리고 아무 콜백도 호출하지 않음
 */
export function useSpeechRecognition(lang = 'ko-KR') {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')

  const recRef = useRef<Recognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestFinishRef = useRef<(() => void) | null>(null)

  // SSR과 hydration 결과를 맞추기 위해 마운트 후 판별
  useEffect(() => {
    setSupported(getRecognitionCtor() !== null)
  }, [])

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    silenceTimerRef.current = null
    maxTimerRef.current = null
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    requestFinishRef.current = null
    const rec = recRef.current
    recRef.current = null
    if (rec) {
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      try {
        rec.abort()
      } catch {}
    }
    setListening(false)
    setInterim('')
  }, [clearTimers])

  // 언마운트 시 마이크 해제
  useEffect(() => stop, [stop])

  const finish = useCallback(() => {
    requestFinishRef.current?.()
  }, [])

  const listen = useCallback(
    ({ onResult, onError }: ListenHandlers) => {
      const Ctor = getRecognitionCtor()
      if (!Ctor) {
        onError('unsupported')
        return
      }
      stop()

      let rec: Recognition
      try {
        rec = new Ctor()
      } catch {
        onError('unsupported')
        return
      }
      rec.lang = lang
      rec.continuous = false
      rec.interimResults = true
      rec.maxAlternatives = 5

      let latest: string[] = []
      let stopping = false

      const complete = (result: string[] | SpeechErrorType) => {
        if (recRef.current !== rec) return
        stop()
        if (Array.isArray(result)) onResult(result)
        else onError(result)
      }
      const completeWithLatest = () => complete(latest.length > 0 ? latest : 'no-speech')

      // 바로 채점하지 않고 정상 종료를 요청해 엔진의 최종 결과를 받는다.
      // (말하는 도중 "인도네시아"가 "인도"까지만 인식된 채로 채점되는 것 방지)
      const requestFinish = () => {
        if (stopping || recRef.current !== rec) return
        stopping = true
        clearTimers()
        try {
          rec.stop()
        } catch {}
        silenceTimerRef.current = setTimeout(completeWithLatest, STOP_GRACE)
      }

      const armSilenceTimer = () => {
        if (stopping) return
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(requestFinish, SILENCE_TIMEOUT)
      }

      rec.onresult = (e) => {
        const results = Array.from(e.results)
        const last = results[results.length - 1]
        if (!last) return
        // 여러 조각으로 나뉜 경우를 위해 전체 문장 + 마지막 조각의 후보들을 함께 사용
        const full = results.map((r) => r[0]?.transcript ?? '').join('')
        const alternatives = Array.from(last, (alt) => alt.transcript)
        latest = [full, ...alternatives].filter(Boolean)
        if (last.isFinal) {
          completeWithLatest()
        } else {
          setInterim(full)
          armSilenceTimer() // 말하는 중에는 시간 연장
        }
      }
      rec.onerror = (e) => {
        // 종료 요청 후 이미 받은 결과가 있으면 그 결과로 채점
        if (stopping && latest.length > 0) completeWithLatest()
        else complete(toErrorType(e.error))
      }
      // iOS Safari는 isFinal 없이 끝나는 경우가 있어 마지막 중간 결과를 사용
      rec.onend = completeWithLatest

      recRef.current = rec
      requestFinishRef.current = requestFinish
      try {
        rec.start()
      } catch {
        recRef.current = null
        requestFinishRef.current = null
        onError('unsupported')
        return
      }
      setListening(true)
      armSilenceTimer()
      maxTimerRef.current = setTimeout(requestFinish, MAX_LISTEN)
    },
    [lang, stop, clearTimers],
  )

  return { supported, listening, interim, listen, finish, stop }
}
