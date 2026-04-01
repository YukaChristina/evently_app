'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, getDefaultCommunity, getCurrentMember, formatDateJa, Event, Member } from '@/lib/supabase'
import MailPreview from '@/components/MailPreview'
import FeedbackForm from '@/components/FeedbackForm'
import Link from 'next/link'

function JoinDoneContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId') ?? ''
  const [event, setEvent] = useState<Event | null>(null)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [eventUrl, setEventUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      setEvent(eventData as Event | null)

      if (typeof window !== 'undefined') {
        setEventUrl(`${window.location.origin}/event/${eventId}`)
      }

      const community = await getDefaultCommunity()
      if (community) {
        const member = await getCurrentMember(community.id)
        setCurrentMember(member)
      }

      setLoading(false)
    }
    load()
  }, [eventId])

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

  const dateStr = formatDateJa(event.date_start, event.date_end)
  const mailSubject = `参加確定 - ${event.title}`
  const mailBody = `${event.title} への参加が確定しました！\n\n📅 ${dateStr}\n📍 ${event.place_private}\n\n${event.detail || ''}\n\nイベントページはこちら：`

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Success banner */}
      <div
        className="rounded-2xl p-5 mb-5 text-center"
        style={{ background: '#e6f9ee', border: '2px solid #06C755' }}
      >
        <p className="text-4xl mb-2">🎉</p>
        <h1 className="text-2xl font-black" style={{ color: '#06C755' }}>
          参加が確定しました！
        </h1>
        <p className="text-sm mt-1" style={{ color: '#00A040' }}>
          {event.title}
        </p>
      </div>

      {/* Event detail */}
      <div className="card mb-4">
        <h2 className="font-bold mb-3" style={{ color: '#1a1a1a' }}>
          イベント詳細（参加確定者限定情報）
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2 text-sm">
            <span>📅</span>
            <span style={{ color: '#333' }}>{dateStr}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span>📍</span>
            <span style={{ color: '#333' }}>{event.place_private}</span>
          </div>
          {event.detail && (
            <div
              className="mt-2 p-3 rounded-xl text-sm whitespace-pre-wrap"
              style={{ background: '#f5f5f5', color: '#333', lineHeight: 1.7 }}
            >
              {event.detail}
            </div>
          )}
        </div>
      </div>

      {/* Mail preview */}
      <div className="mb-5">
        <p className="text-xs font-bold mb-2" style={{ color: '#888' }}>
          参加確定メール（イメージ）
        </p>
        <MailPreview subject={mailSubject} body={mailBody} eventUrl={eventUrl} />
      </div>

      {/* Feedback form */}
      <div className="mb-5">
        <p className="text-xs font-bold mb-2" style={{ color: '#888' }}>
          アプリへのフィードバック
        </p>
        <FeedbackForm eventId={eventId} memberId={currentMember?.id} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/event/${event.id}`}
          className="block w-full text-center font-bold py-3 rounded-full"
          style={{ background: '#06C755', color: '#fff' }}
        >
          参加者一覧に戻る
        </Link>
        <Link
          href={`/chat/${event.id}`}
          className="block w-full text-center font-bold py-3 rounded-full"
          style={{
            background: '#fff',
            color: '#45B7D1',
            border: '1.5px solid #45B7D1',
          }}
        >
          💬 チャットを見る
        </Link>
      </div>
    </div>
  )
}

export default function JoinDonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p style={{ color: '#888' }}>読み込み中...</p>
        </div>
      }
    >
      <JoinDoneContent />
    </Suspense>
  )
}
