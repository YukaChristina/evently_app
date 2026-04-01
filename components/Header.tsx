'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const HOME_PATHS = ['/', '/dashboard', '/create']

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = HOME_PATHS.includes(pathname)
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (isDev) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [isDev, pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-2"
      style={{ background: '#fff', borderBottom: '1px solid #eee', maxWidth: 480, margin: '0 auto' }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span className="font-black text-lg" style={{ color: '#06C755' }}>
          Evently
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {!isHome && (
          <Link
            href="/dashboard"
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: '#06C755', color: '#fff', textDecoration: 'none' }}
          >
            マイイベント
          </Link>
        )}
        {!isDev && userEmail && (
          <button
            onClick={handleLogout}
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: '#f0f0f0',
              color: '#888',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        )}
      </div>
    </div>
  )
}
