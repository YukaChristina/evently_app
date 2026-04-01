'use client'

import { useState, useEffect } from 'react'
import { supabase, getDefaultCommunity, getOrCreateMember, formatDateJa, Member } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const PROFILE_KEY = 'evently_saved_profile'

type JoinFormProps = {
  eventId: string
  isFull: boolean
}

function getInitialForm() {
  if (typeof window === 'undefined') {
    return { name: '', graduationYear: '', major: '', company: '', jobTitle: '', email: '' }
  }
  // テストアカウントから初期値を取得（sessionStorageは同期アクセス可能）
  try {
    const stored = sessionStorage.getItem('evently_test_account')
    if (stored) {
      const account = JSON.parse(stored)
      return {
        name: account.name ?? '',
        graduationYear: String(account.graduation_year ?? ''),
        major: account.major ?? '',
        company: account.company ?? '',
        jobTitle: account.job_title ?? '',
        email: account.email ?? '',
      }
    }
  } catch {}
  // 保存済みプロフィールから取得
  try {
    const saved = localStorage.getItem(PROFILE_KEY)
    if (saved) return { ...{ name: '', graduationYear: '', major: '', company: '', jobTitle: '', email: '' }, ...JSON.parse(saved) }
  } catch {}
  return { name: '', graduationYear: '', major: '', company: '', jobTitle: '', email: '' }
}

export default function JoinForm({ eventId, isFull }: JoinFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(getInitialForm)
  const [saveProfile, setSaveProfile] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // TestLoginBarが切り替わったときに再同期 (dev) / authから自動入力 (prod)
  useEffect(() => {
    const isDev = process.env.NEXT_PUBLIC_ENV === 'development'
    if (isDev) {
      setForm(getInitialForm())
      return
    }
    // 本番: authユーザーのメアドを取得 → 既存メンバーレコードで全項目を入力
    async function prefill() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return
      setForm((prev: typeof form) => ({ ...prev, email: user.email! }))

      const community = await getDefaultCommunity()
      if (!community) return
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .eq('community_id', community.id)
        .single() as { data: Member | null }

      if (member) {
        setForm({
          name: member.name ?? '',
          graduationYear: String(member.graduation_year ?? ''),
          major: member.major ?? '',
          company: member.company ?? '',
          jobTitle: member.job_title ?? '',
          email: member.email ?? '',
        })
      }
    }
    prefill()
  }, [])

  function validate() {
    const e: Partial<Record<keyof typeof form, string>> = {}
    if (!form.name.trim()) e.name = '名前は必須です'
    if (!form.graduationYear.trim()) e.graduationYear = '卒業年度は必須です'
    if (!form.major.trim()) e.major = '専攻は必須です'
    if (!form.email.trim()) {
      e.email = 'メールアドレスは必須です'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = '有効なメールアドレスを入力してください'
    }
    return e
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev: typeof form) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev: Partial<Record<keyof typeof form, string>>) => ({ ...prev, [e.target.name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isFull) return
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const community = await getDefaultCommunity()
      if (!community) {
        setErrorMsg('コミュニティ情報の取得に失敗しました')
        setSubmitting(false)
        return
      }

      const graduationYear = parseInt(form.graduationYear, 10) || null

      const member = await getOrCreateMember(community.id, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        graduation_year: graduationYear,
        major: form.major.trim() || null,
        company: form.company.trim() || null,
        job_title: form.jobTitle.trim() || null,
      })

      if (!member) {
        setErrorMsg('メンバー登録に失敗しました')
        setSubmitting(false)
        return
      }

      // upsert: 既に参加済みでも冪等に処理
      const { error: joinError } = await supabase
        .from('event_members')
        .upsert(
          { event_id: eventId, member_id: member.id, role: 'participant' },
          { onConflict: 'event_id,member_id,role', ignoreDuplicates: true }
        )

      if (joinError) {
        console.error('event_members upsert error:', joinError)
        setErrorMsg('参加登録に失敗しました: ' + joinError.message)
        setSubmitting(false)
        return
      }

      // 参加確定メール送信
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventData && member.email) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'join-confirmation',
            to: member.email,
            memberName: member.name,
            eventTitle: eventData.title,
            dateStr: formatDateJa(eventData.date_start, eventData.date_end),
            placePrivate: eventData.place_private ?? '',
            detail: eventData.detail ?? null,
            eventUrl: `${origin}/event/${eventId}`,
            chatUrl: `${origin}/chat/${eventId}`,
          }),
        })
      }

      // Save member info to sessionStorage for chat
      sessionStorage.setItem('evently_my_member_id', member.id)
      sessionStorage.setItem('evently_my_name', form.name.trim())

      if (saveProfile) {
        localStorage.setItem(
          PROFILE_KEY,
          JSON.stringify({
            name: form.name.trim(),
            graduationYear: form.graduationYear,
            major: form.major.trim(),
            company: form.company.trim(),
            jobTitle: form.jobTitle.trim(),
            email: form.email.trim(),
          })
        )
      } else {
        localStorage.removeItem(PROFILE_KEY)
      }

      router.push(`/join-done?eventId=${eventId}`)
    } catch {
      setErrorMsg('エラーが発生しました。もう一度お試しください。')
      setSubmitting(false)
    }
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
      {errorMsg && (
        <div
          className="p-3 rounded-xl text-sm"
          style={{ background: '#fff0f0', color: '#ff4d4f' }}
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label className="label">名前 *</label>
        <input
          name="name"
          className="input-field"
          value={form.name}
          onChange={handleChange}
          placeholder="例：田中 美咲"
        />
        {errors.name && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="label">卒業年度 *</label>
        <input
          name="graduationYear"
          type="number"
          className="input-field"
          value={form.graduationYear}
          onChange={handleChange}
          placeholder="例：2020"
          min={1990}
          max={2030}
        />
        {errors.graduationYear && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.graduationYear}
          </p>
        )}
      </div>

      <div>
        <label className="label">専攻 *</label>
        <input
          name="major"
          className="input-field"
          value={form.major}
          onChange={handleChange}
          placeholder="例：マーケティング"
        />
        {errors.major && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.major}
          </p>
        )}
      </div>

      <div>
        <label className="label">会社名（任意）</label>
        <input
          name="company"
          className="input-field"
          value={form.company}
          onChange={handleChange}
          placeholder="例：スタートアップ A"
        />
      </div>

      <div>
        <label className="label">役職（任意）</label>
        <input
          name="jobTitle"
          className="input-field"
          value={form.jobTitle}
          onChange={handleChange}
          placeholder="例：CMO"
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
