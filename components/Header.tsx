'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getAllEventIds } from '@/lib/storage'

const ORGANIZER_PATHS = ['/', '/dashboard']

function isOrganizerPage(pathname: string) {
  return pathname === '/' || pathname === '/dashboard'
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const organizer = isOrganizerPage(pathname)

  function switchToParticipant() {
    const ids = getAllEventIds()
    const firstId = ids[0] ?? 'mba2026spring'
    router.push(`/event/${firstId}`)
  }

  function switchToOrganizer() {
    router.push('/dashboard')
  }

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-2"
      style={{ background: '#fff', borderBottom: '1px solid #eee', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Logo */}
      <span className="font-black text-lg" style={{ color: '#06C755' }}>
        Evently
      </span>

      {/* Mode label + switch button */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{
            background: organizer ? '#e6f9ee' : '#f0f4ff',
            color: organizer ? '#06C755' : '#45B7D1',
          }}
        >
          {organizer ? '幹事モード' : '参加者モード'}
        </span>
        <button
          onClick={organizer ? switchToParticipant : switchToOrganizer}
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{
            background: organizer ? '#45B7D1' : '#06C755',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {organizer ? '参加者画面へ' : '幹事画面へ'}
        </button>
      </div>
    </div>
  )
}
