'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getEvent, getChatMessages, getParticipants, ChatMessage, Event } from '@/lib/storage'
import ChatBox from '@/components/ChatBox'
import MailPreview from '@/components/MailPreview'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [myName, setMyName] = useState('ゲスト')
  const [showMailNotif, setShowMailNotif] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const ev = getEvent(id)
    if (!ev) { router.push('/'); return }
    setEvent(ev)

    const name = sessionStorage.getItem('evently_my_name') || 'ゲスト'
    setMyName(name)

    setMessages(getChatMessages(id))
    setParticipantCount(getParticipants(id).length)
  }, [id, router])

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMessages(getChatMessages(id))
      setParticipantCount(getParticipants(id).length)
    }, 2000)
    return () => clearInterval(timer)
  }, [id])

  function handleMessageSent() {
    setMessages(getChatMessages(id))
    setShowMailNotif(true)
    setTimeout(() => setShowMailNotif(false), 5000)
  }

  if (!event) return null

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${id}`
    : `/event/${id}`

  const mailBody = `明日はいよいよ本番です！\n📅 ${event.date}\n📍 ${event.place}\n参加者は現在${participantCount}名です\n\n${eventUrl}`

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
          style={{ background: '#06C755' }}
        >
          <button
            onClick={() => router.push(`/event/${id}`)}
            style={{ color: '#fff', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
          >
            ←
          </button>
          <div>
            <p className="font-bold text-sm" style={{ color: '#fff' }}>参加者チャット</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>{event.title}</p>
          </div>
        </div>

        <div className="px-4 pt-4">
          <ChatBox
            eventId={id}
            messages={messages}
            myName={myName}
            onSend={handleMessageSent}
          />
        </div>

        {/* Mock mail notification */}
        {showMailNotif && (
          <div className="px-4 mt-6">
            <p className="text-xs font-semibold mb-2" style={{ color: '#888' }}>
              📨 メール通知イメージ（実際には送信されません）
            </p>
            <MailPreview
              subject={`明日開催 - ${event.title}`}
              body={mailBody}
              eventUrl={eventUrl}
            />
          </div>
        )}
      </div>
    </div>
  )
}
