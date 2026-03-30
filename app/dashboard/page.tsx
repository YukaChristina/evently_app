'use client'

import { useEffect, useState } from 'react'
import { initDemoData, getAllEventIds, getEvent, getParticipants, deleteEvent, Event, Participant } from '@/lib/storage'
import Link from 'next/link'

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

function getAvatarColor(name: string): string {
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

type EventWithParticipants = {
  event: Event
  participants: Participant[]
}

export default function DashboardPage() {
  const [data, setData] = useState<EventWithParticipants[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set())

  function load() {
    const ids = getAllEventIds()
    const result: EventWithParticipants[] = []
    for (const id of ids) {
      const event = getEvent(id)
      if (!event) continue
      const participants = getParticipants(id)
      result.push({ event, participants })
    }
    // Sort newest first
    result.sort(
      (a, b) =>
        new Date(b.event.createdAt).getTime() -
        new Date(a.event.createdAt).getTime()
    )
    setData(result)
  }

  useEffect(() => {
    initDemoData()
    load()
    const timer = setInterval(load, 3000)
    return () => clearInterval(timer)
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
    } catch {
      // fallback
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#1a1a1a' }}>
            イベント管理画面
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#888' }}>
            3秒ごとに自動更新
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-bold px-4 py-2 rounded-full"
          style={{
            background: '#06C755',
            color: '#fff',
          }}
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
            const isFull = participants.length >= event.capacity
            const isExpanded = expandedParticipants.has(event.id)
            const sorted = [...participants].sort(
              (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
            )
            const displayed = isExpanded ? sorted : sorted.slice(0, 5)
            const hasMore = participants.length > 5

            return (
              <div key={event.id} className="card">
                {/* Event header */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-xs" style={{ color: '#888' }}>
                      {event.community}
                    </p>
                    <h2 className="font-bold text-base leading-tight" style={{ color: '#1a1a1a' }}>
                      {event.title}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {event.date}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: isFull ? '#ff4d4f' : '#e6f9ee',
                      color: isFull ? '#fff' : '#06C755',
                    }}
                  >
                    {participants.length}/{event.capacity}名
                  </span>
                </div>

                {/* URL section */}
                <div
                  className="mt-3 p-3 rounded-xl"
                  style={{ background: '#f0f4f8' }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: '#06C755' }}>
                    📢 LINEグループにこのURLを貼ってください
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-xs flex-1 truncate"
                      style={{ color: '#555' }}
                    >
                      {url}
                    </p>
                    <button
                      onClick={() => copyUrl(event.id)}
                      className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        background: copied === event.id ? '#00A040' : '#06C755',
                        color: '#fff',
                      }}
                    >
                      {copied === event.id ? 'コピー済' : 'コピー'}
                    </button>
                  </div>
                </div>

                {/* Delete */}
                {confirmDelete === event.id ? (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-xl" style={{ background: '#fff0f0' }}>
                    <p className="text-xs flex-1" style={{ color: '#ff4d4f' }}>本当に削除しますか？</p>
                    <button
                      onClick={() => { deleteEvent(event.id); setConfirmDelete(null); load() }}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: '#ff4d4f', color: '#fff' }}
                    >
                      削除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: '#eee', color: '#555' }}
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
                    href={`/chat/${event.id}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-full"
                    style={{
                      background: '#fff',
                      color: '#45B7D1',
                      border: '1.5px solid #45B7D1',
                    }}
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
                            style={{ width: 28, height: 28, background: getAvatarColor(p.name) }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>
                              {p.name}
                            </span>
                            <span className="text-xs ml-2" style={{ color: '#888' }}>
                              {p.year}
                            </span>
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: '#bbb' }}>
                            {formatTime(p.joinedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <button
                        onClick={() => setExpandedParticipants((prev) => {
                          const next = new Set(prev)
                          if (isExpanded) next.delete(event.id)
                          else next.add(event.id)
                          return next
                        })}
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
