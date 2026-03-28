export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  // navigator.serviceWorker.ready는 SW 미등록 시 영원히 대기하므로 타임아웃 적용
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
  const ready = navigator.serviceWorker.ready
  return Promise.race([ready, timeout])
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await getRegistration()
  if (!registration) throw new Error('Service Worker를 찾을 수 없습니다')

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) throw new Error('VAPID public key not configured')

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })

  return subscription
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await getRegistration()
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  await subscription.unsubscribe()
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) return null

  const registration = await getRegistration()
  if (!registration) return null

  return registration.pushManager.getSubscription()
}
