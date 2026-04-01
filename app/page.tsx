'use client'

import { useEffect } from 'react'
import { initDemoData } from '@/lib/supabase'
import { useRequireAuth } from '@/lib/useRequireAuth'
import Link from 'next/link'

export default function HomePage() {
  const { ready } = useRequireAuth()

  useEffect(() => {
    if (!ready) return
    initDemoData()
  }, [ready])

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="text-center mb-10">
        <p className="text-4xl mb-2">🎉</p>
        <h1 className="text-2xl font-black mb-1" style={{ color: '#1a1a1a' }}>
          Evently
        </h1>
        <p className="text-sm" style={{ color: '#888' }}>
          コミュニティのイベント管理をかんたんに
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card flex items-center gap-4"
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontSize: 32 }}>📅</span>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>
                マイイベント一覧
              </p>
              <p className="text-sm" style={{ color: '#888' }}>
                参加・主催イベントをまとめて確認
              </p>
            </div>
            <span className="text-xl" style={{ color: '#ccc' }}>›</span>
          </div>
        </Link>

        <Link
          href="/create"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card flex items-center gap-4"
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontSize: 32 }}>✨</span>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>
                イベントを作成する
              </p>
              <p className="text-sm" style={{ color: '#888' }}>
                新しいイベントを企画・作成する
              </p>
            </div>
            <span className="text-xl" style={{ color: '#ccc' }}>›</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
