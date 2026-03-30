'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessage, saveChatMessage } from '@/lib/storage'

type ChatBoxProps = {
  eventId: string
  messages: ChatMessage[]
  myName: string
  onSend?: () => void
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

export default function ChatBox({ eventId, messages, myName, onSend }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const body = input.trim()
    if (!body) return
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2, 10),
      eventId,
      senderName: myName || 'ゲスト',
      body,
      sentAt: new Date().toISOString(),
    }
    saveChatMessage(msg)
    setInput('')
    onSend?.()
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
          const isMe = msg.senderName === myName
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-xs mb-1" style={{ color: '#888' }}>
                {msg.senderName} · {formatTime(msg.sentAt)}
              </span>
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
          disabled={!input.trim()}
          className="flex-shrink-0 rounded-full font-bold text-sm px-4 py-2"
          style={{
            background: input.trim() ? '#06C755' : '#ccc',
            color: '#fff',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            height: '56px',
          }}
        >
          送信
        </button>
      </div>
    </div>
  )
}
