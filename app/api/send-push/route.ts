import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(req: NextRequest) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:example@example.com'

  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not configured, skipping push')
    return NextResponse.json({ ok: true, sent: 0 })
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  const { subscriptions, title, body, url } = await req.json()

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const payload = JSON.stringify({ title, body, url })
  let sent = 0

  await Promise.allSettled(
    subscriptions.map(async (sub: PushSubscriptionJSON) => {
      try {
        await webpush.sendNotification(sub as webpush.PushSubscription, payload)
        sent++
      } catch (err) {
        console.error('Push send error:', err)
      }
    })
  )

  return NextResponse.json({ ok: true, sent })
}
