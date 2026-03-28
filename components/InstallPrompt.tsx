'use client'

import { useState, useEffect } from 'react'

export function InstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // standalone 모드면 이미 설치된 상태
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // @ts-expect-error - navigator.standalone은 iOS Safari 전용
    if (navigator.standalone) return

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream

    if (!isIOS) return

    // 이전에 닫았으면 24시간 동안 다시 안 보여줌
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return

    // 2초 후에 표시 (페이지 로딩 직후 바로 뜨면 거슬림)
    const timer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', String(Date.now()))
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 animate-[slideUp_0.3s_ease-out]"
    >
      <div className="glass-card p-4 max-w-sm mx-auto">
        <button
          onClick={dismiss}
          className="absolute top-2 right-3 text-gray-400 text-lg leading-none"
          aria-label="닫기"
        >
          &times;
        </button>
        <p className="text-[15px] text-gray-700 font-jua leading-relaxed pr-4">
          홈 화면에 추가하면 앱처럼 쓸 수 있어요!
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-[13px] text-gray-500 font-jua">
          <span>하단</span>
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h3v2H6v11h12V10h-3V8h3a2 2 0 012 2z"/>
          </svg>
          <span>공유 버튼 &rarr; &quot;홈 화면에 추가&quot;</span>
        </div>
      </div>
    </div>
  )
}
