'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, Member, markMessagesAsRead, getReadCounts, getAllEventMembers } from '@/lib/supabase'

type Message = {
  id: string
  body: string
  sent_at: string
  member_id: string
  members: Member | null
}

type ChatBoxProps = {
  eventId: string
  myMemberId: string
  myName?: string
  onSend?: (body: string, senderName: string) => void
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

export default function ChatBox({ eventId, myMemberId, myName, onSend }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [readCounts, setReadCounts] = useState<Record<string, number>>({})
  const [totalMembers, setTotalMembers] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 既読を記録してカウントを再取得
  const recordReads = useCallback(async (msgs: Message[]) => {
    // 自分以外が送ったメッセージを既読にする
    const unreadIds = msgs
      .filter((m) => m.member_id !== myMemberId)
      .map((m) => m.id)
    await markMessagesAsRead(unreadIds, myMemberId)

    // 全メッセージの既読カウントを取得
    const allIds = msgs.map((m) => m.id)
    const counts = await getReadCounts(allIds)
    setReadCounts(counts)
  }, [myMemberId])

  useEffect(() => {
    async function load() {
      // メッセージ取得
      const { data } = await supabase
        .from('chat_messages')
        .select('*, members(*)')
        .eq('event_id', eventId)
        .order('sent_at', { ascending: true })
      const msgs = (data ?? []) as Message[]
      setMessages(msgs)

      // 全メンバー数取得（自分を除いた既読判定用）
      const allMembers = await getAllEventMembers(eventId)
      // 自分を除いた人数が「全員既読」の基準
      setTotalMembers(Math.max(allMembers.length - 1, 0))

      // 既読記録
      await recordReads(msgs)
    }
    load()

    // Realtimeサブスクリプション
    const channel = supabase
      .channel(`chat:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, members(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) => {
              const next = [...prev, data as Message]
              // 自分以外のメッセージなら即座に既読
              if ((data as Message).member_id !== myMemberId) {
                markMessagesAsRead([data.id], myMemberId)
              }
              return next
            })
            // 既読カウント更新
            setReadCounts((prev) => ({ ...prev }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_reads',
        },
        async () => {
          // 既読が更新されたらカウント再取得
          setMessages((prev) => {
            const allIds = prev.map((m) => m.id)
            getReadCounts(allIds).then(setReadCounts)
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, myMemberId, recordReads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      event_id: eventId,
      member_id: myMemberId,
      body,
    })
    setInput('')
    setSending(false)
    onSend?.(body, myName ?? '不明')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: '60vh', minHeight: '300px' }}>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-3 p-3 rounded-2xl mb-3"
        style={{ background: '#f0f4f8' }}
      >
        {messages.length === 0 && (
          <p className="text-center text-sm py-4" style={{ color: '#888' }}>
            まだメッセージはありません
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.member_id === myMemberId
          const senderName = msg.members?.name || '不明'
          const readCount = readCounts[msg.id] ?? 0
          // 自分のメッセージの既読表示：自分以外が読んだ数
          const othersRead = isMe ? readCount : 0
          const showRead = isMe && othersRead > 0
          const allRead = isMe && othersRead >= totalMembers && totalMembers > 0

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {!isMe && (
                <span className="text-xs mb-1" style={{ color: '#888' }}>
                  {senderName} · {formatTime(msg.sent_at)}
                </span>
              )}
              <div
                className="rounded-2xl px-4 py-2 max-w-xs text-sm"
                style={{
                  background: isMe ? '#06C755' : '#ffffff',
                  color: isMe ? '#fff' : '#1a1a1a',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  wordBreak: 'break-word',
                }}
              >
                {msg.body}
              </div>
              {isMe && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs" style={{ color: '#888' }}>
                    {formatTime(msg.sent_at)}
                  </span>
                  {showRead && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: allRead ? '#06C755' : '#aaa' }}
                    >
                      既読 {othersRead}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          className="input-field flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enter で送信)"
          rows={2}
          style={{ resize: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 rounded-full font-bold text-sm px-4 py-2"
          style={{
            background: input.trim() && !sending ? '#06C755' : '#ccc',
            color: '#fff',
            border: 'none',
            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            height: '56px',
          }}
        >
          送信
        </button>
      </div>
    </div>
  )
}
