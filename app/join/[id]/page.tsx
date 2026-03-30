'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { initDemoData, getEvent, getParticipants, Event } from '@/lib/storage'
import JoinForm from '@/components/JoinForm'
import Link from 'next/link'

export default function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDemoData()
    const e = getEvent(id)
    const p = getParticipants(id)
    setEvent(e)
    setParticipantCount(p.length)
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-4xl mb-4">😢</p>
        <p className="font-bold text-lg mb-2">イベントが見つかりません</p>
        <Link
          href="/"
          className="text-sm font-bold px-6 py-2 rounded-full"
          style={{ background: '#06C755', color: '#fff' }}
        >
          トップへ戻る
        </Link>
      </div>
    )
  }

  const isFull = participantCount >= event.capacity

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Back */}
      <Link
        href={`/event/${event.id}`}
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: '#06C755' }}
      >
        ← イベントページへ戻る
      </Link>

      {/* Event info */}
      <div className="card mb-4">
        <p className="text-xs font-bold mb-1" style={{ color: '#06C755' }}>
          {event.community}
        </p>
        <h1 className="font-black text-xl mb-1" style={{ color: '#1a1a1a' }}>
          {event.title}
        </h1>
        <p className="text-sm" style={{ color: '#555' }}>
          📅 {event.date}
        </p>
        <p className="text-sm" style={{ color: '#555' }}>
          📍 {event.placePublic}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: isFull ? '#ff4d4f' : '#e6f9ee',
              color: isFull ? '#fff' : '#06C755',
            }}
          >
            {participantCount}/{event.capacity}名
          </span>
          {!isFull && (
            <span className="text-xs" style={{ color: '#888' }}>
              残り{event.capacity - participantCount}席
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#1a1a1a' }}>
          参加申込フォーム
        </h2>
        <JoinForm eventId={event.id} isFull={isFull} />
      </div>

      <p className="text-xs text-center mt-4" style={{ color: '#bbb' }}>
        入力情報はイベント主催者のみ確認できます
      </p>
    </div>
  )
}
