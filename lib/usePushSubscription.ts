'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePushSubscription(memberId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermission(Notification.permission)
    if (Notification.permission === 'granted' && memberId) {
      checkSubscription(memberId)
    }
  }, [memberId])

  async function checkSubscription(memberId: string) {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) setSubscribed(true)
  }

  async function subscribe() {
    if (!memberId) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission !== 'granted') { setLoading(false); return }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })

      await supabase.from('push_subscriptions').upsert(
        { member_id: memberId, subscription: sub.toJSON() },
        { onConflict: 'member_id' }
      )

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription error:', err)
    }
    setLoading(false)
  }

  return { permission, subscribed, loading, subscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
