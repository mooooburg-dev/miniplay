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
  } catch {
    return NextResponse.json({ error: '구독 저장 실패' }, { status: 500 })
  }
}
