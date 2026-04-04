const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
const SITE_URL = 'https://miniplay.kr'
const OG_IMAGE = `${SITE_URL}/og-image.png`

let sdkPromise: Promise<void> | null = null

function loadKakaoSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    if (window.Kakao) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = KAKAO_SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('카카오 SDK 로드 실패'))
    document.head.appendChild(script)
  })

  return sdkPromise
}

function initKakao() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
  if (!appKey || !window.Kakao) return false
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(appKey)
  }
  return true
}

export interface ShareOptions {
  title: string
  description: string
  buttonText: string
  url?: string
}

async function shareViaKakao(options: ShareOptions): Promise<boolean> {
  try {
    await loadKakaoSdk()
    if (!initKakao()) return false

    const link = { mobileWebUrl: options.url || SITE_URL, webUrl: options.url || SITE_URL }

    window.Kakao!.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: options.title,
        description: options.description,
        imageUrl: OG_IMAGE,
        link,
      },
      buttons: [{ title: options.buttonText, link }],
    })
    return true
  } catch {
    return false
  }
}

async function shareViaWebShare(options: ShareOptions): Promise<'ok' | 'cancel' | 'fail'> {
  if (!navigator.share) return 'fail'
  try {
    await navigator.share({
      title: options.title,
      text: options.description,
      url: options.url || SITE_URL,
    })
    return 'ok'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancel'
    return 'fail'
  }
}

async function shareViaClipboard(options: ShareOptions): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(options.url || SITE_URL)
    alert('링크가 복사되었어요! 붙여넣기로 공유해보세요 📋')
    return true
  } catch {
    return false
  }
}

export async function share(options: ShareOptions): Promise<void> {
  // 모바일에서는 Web Share API 우선, 데스크톱에서는 카카오 우선
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

  if (isMobile) {
    const webResult = await shareViaWebShare(options)
    if (webResult === 'ok' || webResult === 'cancel') return
    if (await shareViaKakao(options)) return
  } else {
    if (await shareViaKakao(options)) return
    const webResult = await shareViaWebShare(options)
    if (webResult === 'ok' || webResult === 'cancel') return
  }

  await shareViaClipboard(options)
}
