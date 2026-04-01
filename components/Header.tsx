'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const HOME_PATHS = ['/', '/dashboard', '/create']

export default function Header() {
  const pathname = usePathname()
  const isHome = HOME_PATHS.includes(pathname)

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

      {!isHome && (
        <Link
          href="/dashboard"
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: '#06C755', color: '#fff', textDecoration: 'none' }}
        >
          マイイベント
        </Link>
      )}
    </div>
  )
}
