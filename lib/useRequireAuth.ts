'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useRequireAuth() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'

  useEffect(() => {
    if (isDev) {
      setReady(true)
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      } else {
        setUser(user)
        setReady(true)
      }
    })
  }, [isDev, router, pathname])

  return { ready, user }
}
