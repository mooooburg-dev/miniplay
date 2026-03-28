import { createClient } from 'redis'

const SUBSCRIPTIONS_KEY = 'push:subscriptions'

function getClient() {
  return createClient({ url: process.env.REDIS_URL })
}

export async function saveSubscription(sub: PushSubscriptionJSON): Promise<void> {
  const client = getClient()
  await client.connect()
  try {
    await client.sAdd(SUBSCRIPTIONS_KEY, JSON.stringify(sub))
  } finally {
    await client.disconnect()
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const client = getClient()
  await client.connect()
  try {
    const all = await client.sMembers(SUBSCRIPTIONS_KEY)
    const target = all.find((m) => {
      const parsed = JSON.parse(m) as PushSubscriptionJSON
      return parsed.endpoint === endpoint
    })
    if (target) {
      await client.sRem(SUBSCRIPTIONS_KEY, target)
    }
  } finally {
    await client.disconnect()
  }
}

export async function getAllSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const client = getClient()
  await client.connect()
  try {
    const members = await client.sMembers(SUBSCRIPTIONS_KEY)
    return members.map((m) => JSON.parse(m) as PushSubscriptionJSON)
  } finally {
    await client.disconnect()
  }
}
