'use client'

import { useState, useEffect, useCallback } from 'react'
import { subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '@/lib/push-client'

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    console.log('[Push] init check:', {
      Notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      PushManager: 'PushManager' in window,
    })

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('[Push] unsupported environment')
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      console.log('[Push] permission denied')
      setStatus('denied')
      return
    }

    console.log('[Push] checking existing subscription...')
    let cancelled = false
    getExistingSubscription()
      .then((sub) => {
        console.log('[Push] existing subscription:', sub ? 'found' : 'none')
        if (!cancelled) setStatus(sub ? 'subscribed' : 'unsubscribed')
      })
      .catch((err) => {
        console.error('[Push] subscription check failed:', err)
        if (!cancelled) setStatus('unsubscribed')
      })
    return () => { cancelled = true }
  }, [])

  const toggle = useCallback(async () => {
    console.log('[Push] toggle clicked, current status:', status)
    try {
      if (status === 'subscribed') {
        await unsubscribeFromPush()
        setStatus('unsubscribed')
      } else {
        const sub = await subscribeToPush()
        console.log('[Push] subscribe result:', sub ? 'success' : 'denied')
        setStatus(sub ? 'subscribed' : 'denied')
      }
    } catch (err) {
      console.error('[Push] toggle error:', err)
      if (Notification.permission === 'denied') {
        setStatus('denied')
      }
    }
  }, [status])

  console.log('[Push] render, status:', status)

  // unsupported 환경에서만 숨김. loading 중에도 버튼 표시 (disabled)
  if (status === 'unsupported') return null

  const isLoading = status === 'loading'
  const isSubscribed = status === 'subscribed'
  const isDenied = status === 'denied'
  const isDisabled = isLoading || isDenied

  return (
    <button
      onClick={isDisabled ? undefined : toggle}
      className={`fixed top-4 right-[4.25rem] sm:right-[4.75rem] z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(255,182,193,0.25)] flex items-center justify-center active:scale-90 transition-all hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,182,193,0.4)] ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={
        isLoading
          ? '알림 준비 중...'
          : isDenied
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
