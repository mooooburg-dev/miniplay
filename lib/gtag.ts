export const GA_ID = 'G-EK2E2ZR7PW'

type GtagEvent = {
  game_name?: string
  [key: string]: string | number | boolean | undefined
}

export function trackEvent(eventName: string, params?: GtagEvent) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName, params ?? {})
  }
}

/** PWA 설치 완료 및 standalone 실행 추적 */
export function initPwaTracking() {
  if (typeof window === 'undefined') return

  // standalone 모드로 실행 중 = 홈 화면에서 앱으로 열었을 때
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - navigator.standalone은 iOS Safari 전용
    navigator.standalone === true

  if (isStandalone) {
    trackEvent('pwa_standalone_launch')
  }

  // 설치 완료 이벤트 (Android Chrome 등)
  window.addEventListener('appinstalled', () => {
    trackEvent('pwa_installed')
  })
}
