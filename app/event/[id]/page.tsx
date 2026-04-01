'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  supabase,
  initDemoData,
  getDefaultCommunity,
  getCurrentMember,
  getMyRole,
  getEventParticipants,
  formatDateJa,
  Event,
  Member,
  EventMember,
} from '@/lib/supabase'
import StatusBar from '@/components/StatusBar'
import ParticipantList from '@/components/ParticipantList'
import Link from 'next/link'

type ParticipantWithMember = EventMember & { member: Member }

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [communityName, setCommunityName] = useState('')
  const [participants, setParticipants] = useState<ParticipantWithMember[]>([])
  const [myRole, setMyRole] = useState<'organizer' | 'participant' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      await initDemoData()

      const { data: eventData } = await supabase
        .from('events')
        .select('*, community:communities(name)')
        .eq('id', id)
        .single()

      if (!eventData) {
        setLoading(false)
        return
      }

      setEvent(eventData as Event)
      setCommunityName((eventData as unknown as { community: { name: string } }).community?.name || '')

      const parts = await getEventParticipants(id)
      setParticipants(parts)

      const community = await getDefaultCommunity()
      if (community) {
        const member = await getCurrentMember(community.id)
        if (member) {
          let role = await getMyRole(id, member.id)

          // sessionStorageに保存されたmember_idでも確認（JoinForm経由で登録した場合）
          if (!role && typeof window !== 'undefined') {
            const storedMemberId = sessionStorage.getItem('evently_my_member_id')
            if (storedMemberId && storedMemberId !== member.id) {
              role = await getMyRole(id, storedMemberId)
            }
          }

          setMyRole(role)
        }
      }

      setLoading(false)
    }
    load()
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

  const capacity = event.capacity || 0
  const participantCount = participants.length
  const isFull = participantCount >= capacity
  const remaining = capacity - participantCount
  const dateStr = formatDateJa(event.date_start, event.date_end)

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Community badge */}
      <p
        className="text-xs font-bold mb-1 px-3 py-1 rounded-full inline-block"
        style={{ background: '#e6f9ee', color: '#06C755' }}
      >
        {communityName}
      </p>

      {/* Event title */}
      <h1 className="text-2xl font-black mt-2 mb-1" style={{ color: '#1a1a1a' }}>
        {event.title}
      </h1>

      {/* Basic info - visible to all */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
          <span>📅</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
          <span>📍</span>
          <span>{event.place_public}（参加確定後に詳細をお知らせします）</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="card mb-4">
        <StatusBar capacity={capacity} filled={participantCount} />
      </div>

      {/* Organizer-only info */}
      {myRole === 'organizer' && (
        <div
          className="card mb-4"
          style={{ background: '#fff8e6', border: '1.5px solid #FFD700' }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: '#b8860b' }}>
            🔑 幹事専用情報
          </p>
          <div className="flex items-start gap-2 text-sm mb-1">
            <span>📍</span>
            <span style={{ color: '#333' }}>{event.place_private}</span>
          </div>
          {event.detail && (
            <div
              className="mt-2 p-3 rounded-xl text-sm whitespace-pre-wrap"
              style={{ background: '#fff', color: '#333', lineHeight: 1.7 }}
            >
              {event.detail}
            </div>
          )}
          <div className="mt-3">
            <Link
              href="/dashboard"
              className="inline-block text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: '#FFD700', color: '#333' }}
            >
              参加者管理へ
            </Link>
          </div>
        </div>
      )}

      {/* Participant-only info */}
      {myRole === 'participant' && (
        <div
          className="card mb-4"
          style={{ background: '#e6f9ee', border: '1.5px solid #06C755' }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: '#06C755' }}>
            ✅ 参加確定情報
          </p>
          <div className="flex items-start gap-2 text-sm mb-1">
            <span>📍</span>
            <span style={{ color: '#333' }}>{event.place_private}</span>
          </div>
          {event.detail && (
            <div
              className="mt-2 p-3 rounded-xl text-sm whitespace-pre-wrap"
              style={{ background: '#fff', color: '#333', lineHeight: 1.7 }}
            >
              {event.detail}
            </div>
          )}
        </div>
      )}

      {/* Action buttons - role-based */}
      {myRole === null && !isFull && (
        <Link
          href={`/join/${event.id}`}
          className="block w-full text-center font-bold text-lg py-3 rounded-full mb-4"
          style={{ background: '#06C755', color: '#fff' }}
        >
          参加する
        </Link>
      )}

      {myRole === null && isFull && (
        <div
          className="w-full text-center font-bold text-lg py-3 rounded-full mb-4"
          style={{ background: '#ff4d4f', color: '#fff' }}
        >
          満席です
        </div>
      )}

      {(myRole === 'participant' || myRole === 'organizer') && (
        <Link
          href={`/chat/${event.id}`}
          className="block w-full text-center font-bold py-3 rounded-full mb-4"
          style={{ background: '#45B7D1', color: '#fff' }}
        >
          💬 参加者チャットへ
        </Link>
      )}

      {/* Remaining seats notice */}
      {myRole === null && !isFull && remaining <= 5 && (
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
          参加者一覧（{participantCount}名）
        </h2>
        <ParticipantList participants={participants.map((p) => p.member)} />
      </div>

      {/* Back */}
      <div className="text-center mt-4">
        <Link href="/dashboard" className="text-xs" style={{ color: '#888' }}>
          ← 管理画面へ
        </Link>
      </div>
    </div>
  )
}
