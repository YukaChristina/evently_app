'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { initDemoData, getEvent, getParticipants, Event, Participant } from '@/lib/storage'
import StatusBar from '@/components/StatusBar'
import ParticipantList from '@/components/ParticipantList'
import Link from 'next/link'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDemoData()
    const e = getEvent(id)
    const p = getParticipants(id)
    setEvent(e)
    setParticipants(p)
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

  const isFull = participants.length >= event.capacity
  const remaining = event.capacity - participants.length

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Community badge */}
      <p
        className="text-xs font-bold mb-1 px-3 py-1 rounded-full inline-block"
        style={{ background: '#e6f9ee', color: '#06C755' }}
      >
        {event.community}
      </p>

      {/* Event title */}
      <h1 className="text-2xl font-black mt-2 mb-1" style={{ color: '#1a1a1a' }}>
        {event.title}
      </h1>

      {/* Basic info */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
          <span>📅</span>
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
          <span>📍</span>
          <span>{event.placePublic}（参加確定後に詳細をお知らせします）</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="card mb-4">
        <StatusBar capacity={event.capacity} filled={participants.length} />
      </div>

      {/* Join button */}
      {!isFull ? (
        <Link
          href={`/join/${event.id}`}
          className="block w-full text-center font-bold text-lg py-3 rounded-full mb-6"
          style={{ background: '#06C755', color: '#fff' }}
        >
          参加する
        </Link>
      ) : (
        <div
          className="w-full text-center font-bold text-lg py-3 rounded-full mb-6"
          style={{ background: '#ff4d4f', color: '#fff' }}
        >
          満席です
        </div>
      )}

      {/* Remaining seats notice */}
      {!isFull && remaining <= 5 && (
        <div
          className="text-center text-sm mb-4 p-2 rounded-xl"
          style={{ background: '#fff3cd', color: '#856404' }}
        >
          ⚠️ 残りわずか！あと{remaining}席です
        </div>
      )}

      {/* Participants list */}
      <div className="card">
        <h2 className="font-bold mb-3" style={{ color: '#1a1a1a' }}>
          参加者一覧（{participants.length}名）
        </h2>
        <ParticipantList participants={participants} />
      </div>

      {/* Chat link */}
      <div className="mt-4">
        <Link
          href={`/chat/${event.id}`}
          className="block w-full text-center font-bold py-3 rounded-full"
          style={{
            background: '#fff',
            color: '#45B7D1',
            border: '1.5px solid #45B7D1',
          }}
        >
          💬 参加者チャット
        </Link>
      </div>

      {/* Back */}
      <div className="text-center mt-4">
        <Link href="/" className="text-xs" style={{ color: '#888' }}>
          ← トップへ
        </Link>
      </div>
    </div>
  )
}
