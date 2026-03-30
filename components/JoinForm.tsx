'use client'

import { useState, useEffect } from 'react'
import { Participant, saveParticipant } from '@/lib/storage'
import { useRouter } from 'next/navigation'

const PROFILE_KEY = 'evently_saved_profile'

type JoinFormProps = {
  eventId: string
  isFull: boolean
}

export default function JoinForm({ eventId, isFull }: JoinFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    year: '',
    job: '',
    email: '',
  })
  const [saveProfile, setSaveProfile] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const profile = JSON.parse(saved)
        setForm((prev) => ({ ...prev, ...profile }))
        setSaveProfile(true)
      }
    } catch {}
  }, [])

  function validate() {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()) e.name = '名前は必須です'
    if (!form.year.trim()) e.year = '卒業年度・専攻は必須です'
    if (!form.email.trim()) {
      e.email = 'メールアドレスは必須です'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = '有効なメールアドレスを入力してください'
    }
    return e
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isFull) return
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    const participant: Participant = {
      id: Math.random().toString(36).slice(2, 10),
      eventId,
      name: form.name.trim(),
      year: form.year.trim(),
      job: form.job.trim(),
      email: form.email.trim(),
      joinedAt: new Date().toISOString(),
    }
    saveParticipant(participant)
    sessionStorage.setItem('evently_my_name', form.name.trim())
    if (saveProfile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        name: form.name.trim(),
        year: form.year.trim(),
        job: form.job.trim(),
        email: form.email.trim(),
      }))
    } else {
      localStorage.removeItem(PROFILE_KEY)
    }
    router.push(`/join-done?eventId=${eventId}`)
  }

  if (isFull) {
    return (
      <div
        className="text-center py-8 rounded-2xl"
        style={{ background: '#fff0f0', color: '#ff4d4f' }}
      >
        <p className="text-2xl font-bold mb-2">😢 満席です</p>
        <p className="text-sm">このイベントは定員に達しました</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">名前 *</label>
        <input
          name="name"
          className="input-field"
          value={form.name}
          onChange={handleChange}
          placeholder="例：田中 勇希"
        />
        {errors.name && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="label">卒業年度・専攻 *</label>
        <input
          name="year"
          className="input-field"
          value={form.year}
          onChange={handleChange}
          placeholder="例：2022年卒 / 経営戦略"
        />
        {errors.year && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.year}
          </p>
        )}
      </div>

      <div>
        <label className="label">現職（任意）</label>
        <input
          name="job"
          className="input-field"
          value={form.job}
          onChange={handleChange}
          placeholder="例：スタートアップ CMO"
        />
      </div>

      <div>
        <label className="label">メールアドレス *</label>
        <input
          name="email"
          type="email"
          className="input-field"
          value={form.email}
          onChange={handleChange}
          placeholder="例：your@email.com"
        />
        {errors.email && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.email}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={saveProfile}
          onChange={(e) => setSaveProfile(e.target.checked)}
          style={{ accentColor: '#06C755', width: 18, height: 18 }}
        />
        <span className="text-sm" style={{ color: '#555' }}>
          プロフィールを保存する（次回から自動入力）
        </span>
      </label>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? '申込中...' : '参加を申し込む'}
      </button>
    </form>
  )
}
