'use client'

import { Member } from '@/lib/supabase'

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

export function getAvatarColor(name: string, avatarColor?: string | null): string {
  if (avatarColor) return avatarColor
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function getAvatarChar(name: string): string {
  return name.trim().charAt(0)
}

type ParticipantListProps = {
  participants: Member[]
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
        const color = getAvatarColor(p.name, p.avatar_color)
        const char = getAvatarChar(p.name)
        const yearLabel = p.graduation_year
          ? `Class of ${p.graduation_year}${p.major ? ` / ${p.major}` : ''}`
          : p.major || ''
        const jobLabel = [p.company, p.job_title].filter(Boolean).join(' ')

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
              {yearLabel && (
                <p className="text-xs truncate" style={{ color: '#888' }}>
                  {yearLabel}
                </p>
              )}
              {jobLabel && (
                <p className="text-xs truncate" style={{ color: '#555' }}>
                  {jobLabel}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
