'use client'

import { Participant } from '@/lib/storage'

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
]

function getAvatarColor(name: string): string {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function getAvatarChar(name: string): string {
  return name.trim().charAt(0)
}

type ParticipantListProps = {
  participants: Participant[]
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-center text-sm py-4" style={{ color: '#888' }}>
        まだ参加者はいません
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {participants.map((p) => {
        const color = getAvatarColor(p.name)
        const char = getAvatarChar(p.name)
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: '#f9f9f9' }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold text-lg"
              style={{
                width: '44px',
                height: '44px',
                background: color,
                color: '#fff',
              }}
            >
              {char}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: '#1a1a1a' }}>
                {p.name}
              </p>
              <p className="text-xs truncate" style={{ color: '#888' }}>
                {p.year}
              </p>
              {p.job && (
                <p className="text-xs truncate" style={{ color: '#555' }}>
                  {p.job}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { getAvatarColor, getAvatarChar }
