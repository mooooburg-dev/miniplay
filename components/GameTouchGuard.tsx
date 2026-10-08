'use client'
import { useEffect } from 'react'

/**
 * 게임 화면 제스처 가드 — 버튼을 연타·꾹 누르는 게임에서 화면이 확대되지 않게 한다.
 * CSS touch-action(pan-y)으로 대부분 막히지만 iOS Safari는 viewport user-scalable=no를 무시하고
 * 핀치 확대를 허용하므로 전용 gesture 이벤트를 막는다.
 */
export function GameTouchGuard() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    const events = ['gesturestart', 'gesturechange', 'gestureend'] as const
    events.forEach((name) => document.addEventListener(name, prevent, { passive: false }))
    return () => events.forEach((name) => document.removeEventListener(name, prevent))
  }, [])
  return null
}
