import { NextResponse } from 'next/server'
import { saveSubscription } from '@/lib/push-subscriptions'

export async function POST(request: Request) {
  try {
    const sub: PushSubscriptionJSON = await request.json()

    if (!sub.endpoint || !sub.keys) {
      return NextResponse.json({ error: '잘못된 구독 정보입니다' }, { status: 400 })
    }

    await saveSubscription(sub)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Push Subscribe Error]', message)
    return NextResponse.json({ error: '구독 저장 실패', detail: message }, { status: 500 })
  }
}
