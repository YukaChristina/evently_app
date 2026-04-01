'use client'

import { useEffect, useState } from 'react'
import {
  supabase,
  initDemoData,
  getDefaultCommunity,
  getCurrentMember,
  getOrganizerEvents,
  getParticipantEvents,
  getEventParticipants,
  formatDateJa,
  Event,
  Member,
  EventMember,
} from '@/lib/supabase'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/useRequireAuth'

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

// 幹事用イベントカード（フル表示）
function OrganizerEventCard({
  event,
  participants,
  currentMemberId,
  copied,
  copiedLine,
  confirmDelete,
  expandedParticipants,
  showAnnouncement,
  onCopyUrl,
  onCopyLine,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggleExpand,
  onToggleAnnouncement,
}: {
  event: Event
  participants: ParticipantWithMember[]
  currentMemberId: string
  copied: string | null
  copiedLine: string | null
  confirmDelete: string | null
  expandedParticipants: Set<string>
  showAnnouncement: string | null
  onCopyUrl: (id: string) => void
  onCopyLine: (event: Event) => void
  onDelete: (id: string) => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  onToggleExpand: (id: string) => void
  onToggleAnnouncement: (id: string) => void
}) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/event/${event.id}` : ''
  const capacity = event.capacity || 0
  const isFull = participants.length >= capacity
  const isExpanded = expandedParticipants.has(event.id)
  const sorted = [...participants].sort(
    (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
  )
  const displayed = isExpanded ? sorted : sorted.slice(0, 5)
  const hasMore = participants.length > 5
  const dateStr = formatDateJa(event.date_start, event.date_end)

  function getLineText() {
    return `【${event.title}】\n📅 ${dateStr}\n📍 ${event.place_public}\n\n参加はこちらから👇\n${url}`
  }

  return (
    <div className="card">
      {/* Role badge */}
      <div className="mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#fff3cd', color: '#b8860b' }}
        >
          🔑 幹事
        </span>
      </div>

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
        <p className="text-xs font-bold mb-2" style={{ color: '#06C755' }}>
          📢 LINEグループに貼る文面
        </p>
        <div
          className="text-xs p-2 rounded-xl mb-2 whitespace-pre-wrap"
          style={{ background: '#fff', color: '#333', lineHeight: 1.7 }}
        >
          {getLineText()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onCopyLine(event)}
            className="flex-1 text-xs font-bold py-1.5 rounded-full"
            style={{
              background: copiedLine === event.id ? '#00A040' : '#06C755',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {copiedLine === event.id ? '✓ コピー済' : '📋 文面をコピー'}
          </button>
          <button
            onClick={() => onCopyUrl(event.id)}
            className="flex-1 text-xs font-bold py-1.5 rounded-full"
            style={{
              background: '#fff',
              color: '#06C755',
              border: '1.5px solid #06C755',
              cursor: 'pointer',
            }}
          >
            {copied === event.id ? '✓ URL コピー済' : 'URLだけコピー'}
          </button>
        </div>
      </div>

      {/* Announcement */}
      <div className="mt-3">
        <button
          onClick={() => onToggleAnnouncement(event.id)}
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
        {showAnnouncement === event.id && (
          <AnnouncementForm
            eventId={event.id}
            memberId={currentMemberId}
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
            onClick={() => onDelete(event.id)}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            削除
          </button>
          <button
            onClick={onCancelDelete}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: '#eee', color: '#555', border: 'none', cursor: 'pointer' }}
          >
            キャンセル
          </button>
        </div>
      ) : (
        <button
          onClick={() => onConfirmDelete(event.id)}
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
              onClick={() => onToggleExpand(event.id)}
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
}

// 参加者用シンプルカード
function ParticipantEventCard({ event }: { event: Event }) {
  const capacity = event.capacity || 0
  const dateStr = formatDateJa(event.date_start, event.date_end)

  return (
    <div className="card">
      {/* Role badge */}
      <div className="mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#e6f9ee', color: '#06C755' }}
        >
          ✅ 参加者
        </span>
      </div>

      <div className="flex justify-between items-start mb-2">
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
        {capacity > 0 && (
          <span
            className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: '#e6f9ee', color: '#06C755' }}
          >
            定員{capacity}名
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Link
          href={`/event/${event.id}`}
          className="flex-1 text-center text-xs font-bold py-2 rounded-full"
          style={{ background: '#fff', color: '#06C755', border: '1.5px solid #06C755' }}
        >
          イベント詳細
        </Link>
        <Link
          href={`/chat/${event.id}`}
          className="flex-1 text-center text-xs font-bold py-2 rounded-full"
          style={{ background: '#45B7D1', color: '#fff' }}
        >
          💬 参加者チャット
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { ready } = useRequireAuth()
  const [organizerData, setOrganizerData] = useState<EventWithParticipants[]>([])
  const [participantEvents, setParticipantEvents] = useState<Event[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [copiedLine, setCopiedLine] = useState<string | null>(null)
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

    // 幹事イベント
    const orgEvents = await getOrganizerEvents(member.id)
    const orgResult: EventWithParticipants[] = []
    for (const event of orgEvents) {
      const participants = await getEventParticipants(event.id)
      orgResult.push({ event, participants })
    }
    setOrganizerData(orgResult)

    // 参加者イベント
    const partEvents = await getParticipantEvents(member.id)
    setParticipantEvents(partEvents)

    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready])

  async function copyUrl(eventId: string) {
    const url = `${window.location.origin}/event/${eventId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(eventId)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  async function copyLineText(event: Event) {
    const url = `${window.location.origin}/event/${event.id}`
    const dateStr = formatDateJa(event.date_start, event.date_end)
    const text = `【${event.title}】\n📅 ${dateStr}\n📍 ${event.place_public}\n\n参加はこちらから👇\n${url}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLine(event.id)
      setTimeout(() => setCopiedLine(null), 2000)
    } catch {}
  }

  async function handleDelete(eventId: string) {
    await supabase.from('event_members').delete().eq('event_id', eventId)
    await supabase.from('chat_messages').delete().eq('event_id', eventId)
    await supabase.from('announcements').delete().eq('event_id', eventId)
    await supabase.from('events').delete().eq('id', eventId)
    setConfirmDelete(null)
    setOrganizerData((prev) => prev.filter((d) => d.event.id !== eventId))
  }

  function toggleExpand(eventId: string) {
    setExpandedParticipants((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  function toggleAnnouncement(eventId: string) {
    setShowAnnouncement((prev) => (prev === eventId ? null : eventId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    )
  }

  const hasAnyEvent = organizerData.length > 0 || participantEvents.length > 0

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#1a1a1a' }}>
          マイイベント
        </h1>
        <Link
          href="/create"
          className="text-sm font-bold px-4 py-2 rounded-full"
          style={{ background: '#06C755', color: '#fff' }}
        >
          ＋ 作成
        </Link>
      </div>

      {!hasAnyEvent ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-bold" style={{ color: '#1a1a1a' }}>
            イベントがありません
          </p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            イベントを作成するか、参加リンクから申し込んでください
          </p>
          <Link
            href="/create"
            className="inline-block mt-4 text-sm font-bold px-6 py-2 rounded-full"
            style={{ background: '#06C755', color: '#fff' }}
          >
            イベントを作成する
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 幹事セクション */}
          {organizerData.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-3" style={{ color: '#b8860b' }}>
                🔑 幹事として担当するイベント（{organizerData.length}件）
              </p>
              <div className="flex flex-col gap-4">
                {organizerData.map(({ event, participants }) => (
                  <OrganizerEventCard
                    key={event.id}
                    event={event}
                    participants={participants}
                    currentMemberId={currentMember?.id ?? ''}
                    copied={copied}
                    copiedLine={copiedLine}
                    confirmDelete={confirmDelete}
                    expandedParticipants={expandedParticipants}
                    showAnnouncement={showAnnouncement}
                    onCopyUrl={copyUrl}
                    onCopyLine={copyLineText}
                    onDelete={handleDelete}
                    onConfirmDelete={setConfirmDelete}
                    onCancelDelete={() => setConfirmDelete(null)}
                    onToggleExpand={toggleExpand}
                    onToggleAnnouncement={toggleAnnouncement}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 参加者セクション */}
          {participantEvents.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-3" style={{ color: '#06C755' }}>
                ✅ 参加予定のイベント（{participantEvents.length}件）
              </p>
              <div className="flex flex-col gap-4">
                {participantEvents.map((event) => (
                  <ParticipantEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-6">
        <Link href="/" className="text-xs" style={{ color: '#888' }}>
          ← ホームへ
        </Link>
      </div>
    </div>
  )
}
