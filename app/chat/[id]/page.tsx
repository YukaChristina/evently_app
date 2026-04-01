'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  supabase,
  getDefaultCommunity,
  getCurrentMember,
  getMyRole,
  getAllEventMembers,
  Event,
  Member,
} from '@/lib/supabase'
import ChatBox from '@/components/ChatBox'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [myMember, setMyMember] = useState<Member | null>(null)
  const [myRole, setMyRole] = useState<'organizer' | 'participant' | null>(null)
  const [loading, setLoading] = useState(true)
  const allMembersRef = useRef<Member[]>([])

  useEffect(() => {
    async function load() {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (!eventData) {
        router.push('/')
        return
      }

      setEvent(eventData as Event)

      const community = await getDefaultCommunity()
      if (community) {
        const member = await getCurrentMember(community.id)
        if (member) {
          setMyMember(member)
          const role = await getMyRole(id, member.id)
          setMyRole(role)
        }
      }

      // チャット通知用に全メンバーを取得
      allMembersRef.current = await getAllEventMembers(id)

      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleSend(body: string, senderName: string) {
    if (!event) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    // 投稿者以外のメールアドレスに通知
    const toEmails = allMembersRef.current
      .filter((m) => m.id !== myMember?.id && m.email)
      .map((m) => m.email as string)

    if (toEmails.length > 0) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat-notification',
          to: toEmails,
          senderName,
          eventTitle: event.title,
          bodyPreview: body.length > 50 ? body.slice(0, 50) + '...' : body,
          chatUrl: `${origin}/chat/${id}`,
        }),
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    )
  }

  if (!event) return null

  if (myRole === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-bold text-lg mb-2">参加者・幹事のみ閲覧できます</p>
        <button
          onClick={() => router.push(`/event/${id}`)}
          className="text-sm font-bold px-6 py-2 rounded-full mt-2"
          style={{ background: '#06C755', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          イベントページへ
        </button>
      </div>
    )
  }

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
            <p className="font-bold text-sm" style={{ color: '#fff' }}>
              参加者チャット
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {event.title}
            </p>
          </div>
          {myRole === 'organizer' && (
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              幹事
            </span>
          )}
        </div>

        <div className="px-4 pt-4">
          {myMember && (
            <ChatBox
              eventId={id}
              myMemberId={myMember.id}
              myName={myMember.name}
              onSend={handleSend}
            />
          )}
        </div>
      </div>
    </div>
  )
}
