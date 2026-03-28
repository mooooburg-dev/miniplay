import { NextResponse } from 'next/server'
import { removeSubscription } from '@/lib/push-subscriptions'

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint가 필요합니다' }, { status: 400 })
    }

    await removeSubscription(endpoint)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '구독 해제 실패' }, { status: 500 })
  }
}
