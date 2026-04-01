'use client'

import { useEffect, useState } from 'react'
import {
  supabase,
  initDemoData,
  getDefaultCommunity,
  getCurrentMember,
  getOrganizerEvents,
  getEventParticipants,
  getAllEventMembers,
  formatDateJa,
  Event,
  Member,
  EventMember,
} from '@/lib/supabase'
import Link from 'next/link'

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

function getAvatarColor(name: string, avatarColor?: string | null): string {
  if (avatarColor) return avatarColor
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

type ParticipantWithMember = EventMember & { member: Member }

type EventWithParticipants = {
  event: Event
  participants: ParticipantWithMember[]
}

// アナウンス投稿フォーム
function AnnouncementForm({
  eventId,
  memberId,
  participants,
  eventTitle,
}: {
  eventId: string
  memberId: string
  participants: ParticipantWithMember[]
  eventTitle: string
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)

    await supabase.from('announcements').insert({
      event_id: eventId,
      member_id: memberId,
      title: title.trim() || null,
      body: body.trim(),
      is_pinned: false,
    })

    // 全参加者にメール通知
    const toEmails = participants
      .filter((p) => p.member.email)
      .map((p) => p.member.email as string)

    if (toEmails.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          to: toEmails,
          eventTitle,
          announcementTitle: title.trim() || null,
          announcementBody: body.trim(),
          eventUrl: `${origin}/event/${eventId}`,
        }),
      })
    }

    setTitle('')
    setBody('')
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <p className="text-xs font-bold mb-2" style={{ color: '#888' }}>
        📢 参加者全員へのお知らせ
      </p>
      <input
        className="input-field mb-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル（任意）"
      />
      <textarea
        className="input-field mb-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="お知らせ内容を入力..."
        rows={3}
        style={{ resize: 'vertical' }}
        required
      />
      <button
        type="submit"
        disabled={!body.trim() || sending}
        className="w-full text-xs font-bold py-2 rounded-full"
        style={{
          background: body.trim() && !sending ? '#06C755' : '#ccc',
          color: '#fff',
          border: 'none',
          cursor: body.trim() && !sending ? 'pointer' : 'not-allowed',
        }}
      >
        {sent ? '✓ 送信しました' : sending ? '送信中...' : '全参加者にお知らせを送信'}
      </button>
    </form>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<EventWithParticipants[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set())
  const [showAnnouncement, setShowAnnouncement] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)

  async function load() {
    await initDemoData()

    const community = await getDefaultCommunity()
    if (!community) { setLoading(false); return }

    const member = await getCurrentMember(community.id)
    if (!member) { setLoading(false); return }

    setCurrentMember(member)

    const events = await getOrganizerEvents(member.id)
    const result: EventWithParticipants[] = []

    for (const event of events) {
      const participants = await getEventParticipants(event.id)
      result.push({ event, participants })
    }

    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function getEventUrl(eventId: string) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/event/${eventId}`
  }

  async function copyUrl(eventId: string) {
    const url = getEventUrl(eventId)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(eventId)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  async function handleDelete(eventId: string) {
    await supabase.from('event_members').delete().eq('event_id', eventId)
    await supabase.from('chat_messages').delete().eq('event_id', eventId)
    await supabase.from('announcements').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId)
    setConfirmDelete(null)
    setData((prev) => prev.filter((d) => d.event.id !== eventId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#1a1a1a' }}>
            イベント管理画面
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm font-bold px-4 py-2 rounded-full"
          style={{ background: '#06C755', color: '#fff' }}
        >
          ＋ イベントを作成する
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-bold" style={{ color: '#1a1a1a' }}>
            イベントがありません
          </p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            トップページからイベントを作成してください
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm font-bold px-6 py-2 rounded-full"
            style={{ background: '#06C755', color: '#fff' }}
          >
            イベントを作成する
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map(({ event, participants }) => {
            const url = getEventUrl(event.id)
            const capacity = event.capacity || 0
            const isFull = participants.length >= capacity
            const isExpanded = expandedParticipants.has(event.id)
            const sorted = [...participants].sort(
              (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
            )
            const displayed = isExpanded ? sorted : sorted.slice(0, 5)
            const hasMore = participants.length > 5
            const dateStr = formatDateJa(event.date_start, event.date_end)

            return (
              <div key={event.id} className="card">
                {/* Event header */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0 mr-2">
                    <h2 className="font-bold text-base leading-tight" style={{ color: '#1a1a1a' }}>
                      {event.title}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {dateStr}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      📍 {event.place_public}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: isFull ? '#ff4d4f' : '#e6f9ee',
                      color: isFull ? '#fff' : '#06C755',
                    }}
                  >
                    {participants.length}/{capacity}名
                  </span>
                </div>

                {/* Private location */}
                <div className="mt-1 text-xs" style={{ color: '#555' }}>
                  🔑 実際の場所：{event.place_private}
                </div>

                {/* URL section */}
                <div className="mt-3 p-3 rounded-xl" style={{ background: '#f0f4f8' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#06C755' }}>
                    📢 LINEグループにこのURLを貼ってください
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs flex-1 truncate" style={{ color: '#555' }}>
                      {url}
                    </p>
                    <button
                      onClick={() => copyUrl(event.id)}
                      className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        background: copied === event.id ? '#00A040' : '#06C755',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {copied === event.id ? 'コピー済' : 'コピー'}
                    </button>
                  </div>
                </div>

                {/* Announcement */}
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setShowAnnouncement(
                        showAnnouncement === event.id ? null : event.id
                      )
                    }
                    className="text-xs font-bold px-3 py-1.5 rounded-full w-full text-left"
                    style={{
                      background: showAnnouncement === event.id ? '#fff3cd' : '#f9f9f9',
                      color: '#333',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                  >
                    {showAnnouncement === event.id ? '▲ お知らせを閉じる' : '📢 参加者へのお知らせを送る'}
                  </button>
                  {showAnnouncement === event.id && currentMember && (
                    <AnnouncementForm
                      eventId={event.id}
                      memberId={currentMember.id}
                      participants={participants}
                      eventTitle={event.title}
                    />
                  )}
                </div>

                {/* Delete */}
                {confirmDelete === event.id ? (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-xl" style={{ background: '#fff0f0' }}>
                    <p className="text-xs flex-1" style={{ color: '#ff4d4f' }}>本当に削除しますか？</p>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      削除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: '#eee', color: '#555', border: 'none', cursor: 'pointer' }}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(event.id)}
                    className="mt-2 text-xs"
                    style={{ color: '#bbb', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    🗑 このイベントを削除
                  </button>
                )}

                {/* Quick links */}
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/event/${event.id}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-full"
                    style={{ background: '#fff', color: '#06C755', border: '1.5px solid #06C755' }}
                  >
                    イベントページ
                  </Link>
                  <Link
                    href={`/chat/${event.id}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-full"
                    style={{ background: '#fff', color: '#45B7D1', border: '1.5px solid #45B7D1' }}
                  >
                    💬 チャット
                  </Link>
                </div>

                {/* Participants */}
                {sorted.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold mb-2" style={{ color: '#888' }}>
                      参加者一覧
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {displayed.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 flex items-center justify-center rounded-full text-white text-xs font-bold"
                            style={{
                              width: 28,
                              height: 28,
                              background: getAvatarColor(p.member.name, p.member.avatar_color),
                            }}
                          >
                            {p.member.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>
                              {p.member.name}
                            </span>
                            {p.member.graduation_year && (
                              <span className="text-xs ml-2" style={{ color: '#888' }}>
                                Class of {p.member.graduation_year}
                                {p.member.major ? ` / ${p.member.major}` : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: '#bbb' }}>
                            {formatTime(p.joined_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <button
                        onClick={() =>
                          setExpandedParticipants((prev) => {
                            const next = new Set(prev)
                            if (isExpanded) next.delete(event.id)
                            else next.add(event.id)
                            return next
                          })
                        }
                        className="text-xs mt-2 font-bold"
                        style={{ color: '#06C755', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {isExpanded ? '▲ 折りたたむ' : `▼ 他${participants.length - 5}名を表示`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
