'use client'

import { useEffect } from 'react'
import { initDemoData } from '@/lib/supabase'
import EventForm from '@/components/EventForm'

export default function HomePage() {
  useEffect(() => {
    initDemoData()
  }, [])

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
          イベントを作成する
        </h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
          新しいイベントを作成
        </h2>
        <EventForm />
      </div>

      <p className="text-center text-xs mt-6" style={{ color: '#bbb' }}>
        データはSupabase（PostgreSQL）に保存されます
      </p>
    </div>
  )
}
