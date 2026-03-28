'use client'

import { useState, useEffect, useCallback } from 'react'
import { subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '@/lib/push-client'

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    // PushManager 미지원 환경
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    // SW 준비 후 구독 상태 확인
    let cancelled = false
    getExistingSubscription()
      .then((sub) => {
        if (!cancelled) setStatus(sub ? 'subscribed' : 'unsubscribed')
      })
      .catch(() => {
        if (!cancelled) setStatus('unsubscribed')
      })
    return () => { cancelled = true }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (status === 'subscribed') {
        await unsubscribeFromPush()
        setStatus('unsubscribed')
      } else {
        const sub = await subscribeToPush()
        setStatus(sub ? 'subscribed' : 'denied')
      }
    } catch (err) {
      console.error('[Push] toggle error:', err)
      // 권한이 거부된 경우
      if (Notification.permission === 'denied') {
        setStatus('denied')
      }
    }
  }, [status])

  // 지원하지 않는 환경에서는 렌더하지 않음
  if (status === 'loading' || status === 'unsupported') return null

  const isSubscribed = status === 'subscribed'
  const isDenied = status === 'denied'

  return (
    <button
      onClick={isDenied ? undefined : toggle}
      className={`fixed top-4 right-[4.25rem] sm:right-[4.75rem] z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(255,182,193,0.25)] flex items-center justify-center active:scale-90 transition-all hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,182,193,0.4)] ${isDenied ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={
        isDenied
          ? '알림이 차단됨 - 브라우저 설정에서 허용해주세요'
          : isSubscribed
            ? '알림 끄기'
            : '알림 켜기'
      }
      aria-label={isSubscribed ? '알림 끄기' : '알림 켜기'}
    >
      {isSubscribed ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
    </button>
  )
}
