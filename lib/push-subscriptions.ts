import { kv } from '@vercel/kv'

const SUBSCRIPTIONS_KEY = 'push:subscriptions'

export async function saveSubscription(sub: PushSubscriptionJSON): Promise<void> {
  await kv.sadd(SUBSCRIPTIONS_KEY, JSON.stringify(sub))
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const all = await getAllSubscriptions()
  const target = all.find((s) => s.endpoint === endpoint)
  if (target) {
    await kv.srem(SUBSCRIPTIONS_KEY, JSON.stringify(target))
  }
}

export async function getAllSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const members = await kv.smembers(SUBSCRIPTIONS_KEY)
  return members.map((m) => (typeof m === 'string' ? JSON.parse(m) : m) as PushSubscriptionJSON)
}
