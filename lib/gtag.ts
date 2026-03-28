export const GA_ID = 'G-EK2E2ZR7PW'

type GtagEvent = {
  game_name: string
  [key: string]: string | number | boolean
}

export function trackEvent(eventName: string, params: GtagEvent) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName, params)
  }
}
