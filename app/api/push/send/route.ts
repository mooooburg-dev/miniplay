import { NextResponse } from 'next/server'
import webPush from 'web-push'
import { getAllSubscriptions, removeSubscription } from '@/lib/push-subscriptions'

function getWebPush() {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@miniplay.kr',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  return webPush
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // 관리자 인증
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.PUSH_ADMIN_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const { title, body, url, tag } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'title과 body는 필수입니다' }, { status: 400 })
    }

    const push = getWebPush()
    const payload = JSON.stringify({ title, body, url, tag })
    const subscriptions = await getAllSubscriptions()

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await push.sendNotification(
            {
              endpoint: sub.endpoint!,
              keys: sub.keys as { p256dh: string; auth: string },
            },
            payload,
          )
          sent++
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          // 410 Gone = 만료된 구독, 삭제
          if (statusCode === 410 || statusCode === 404) {
            await removeSubscription(sub.endpoint!)
          }
          failed++
        }
      }),
    )

    return NextResponse.json({ ok: true, sent, failed, total: subscriptions.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Push Send Error]', message)
    return NextResponse.json({ error: '전송 실패', detail: message }, { status: 500 })
  }
}
