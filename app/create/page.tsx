'use client'

import { useEffect } from 'react'
import { initDemoData } from '@/lib/supabase'
import EventForm from '@/components/EventForm'
import Link from 'next/link'

export default function CreatePage() {
  useEffect(() => {
    initDemoData()
  }, [])

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="text-xs" style={{ color: '#888' }}>
          ← ホームへ
        </Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
          新しいイベントを作成
        </h2>
        <EventForm />
      </div>
    </div>
  )
}
