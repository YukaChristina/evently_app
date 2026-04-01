'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  eventId: string
  memberId?: string | null
}

export default function FeedbackForm({ eventId, memberId }: Props) {
  const [rating, setRating] = useState<'good' | 'okay' | 'bad' | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    await supabase.from('feedbacks').insert({
      event_id: eventId,
      member_id: memberId || null,
      rating,
      comment: comment.trim() || null,
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div
        className="p-4 rounded-2xl text-center"
        style={{ background: '#e6f9ee', border: '1.5px solid #06C755' }}
      >
        <p className="text-2xl mb-1">🙏</p>
        <p className="font-bold" style={{ color: '#06C755' }}>
          フィードバックを送信しました！ありがとうございます
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ border: '1.5px solid #e0e0e0' }}
    >
      <h3 className="font-bold mb-3" style={{ color: '#1a1a1a' }}>
        使ってみていかがでしたか？
      </h3>
      <div className="flex gap-2 mb-4">
        {(['good', 'okay', 'bad'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRating(r)}
            className="flex-1 py-2 rounded-full text-xs font-bold"
            style={{
              background: rating === r ? '#06C755' : '#f0f0f0',
              color: rating === r ? '#fff' : '#555',
              border: rating === r ? '2px solid #06C755' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {r === 'good' ? 'とても使いやすかった' : r === 'okay' ? 'まあまあ' : '使いにくかった'}
          </button>
        ))}
      </div>
      <div className="mb-3">
        <label className="label">一言コメント</label>
        <input
          className="input-field"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ご意見をお聞かせください"
        />
      </div>
      <button
        type="submit"
        disabled={!rating || submitting}
        className="btn-primary"
        style={{ opacity: !rating || submitting ? 0.5 : 1 }}
      >
        送信する
      </button>
    </form>
  )
}
