'use client'

import { useState } from 'react'
import { supabase, getTestAccount, getDefaultCommunity, getOrCreateMember } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16)
}

export default function EventForm() {
  const router = useRouter()
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'

  const [form, setForm] = useState({
    title: 'ビジネスネットワーキング夜会 Vol.3',
    community: 'MBA同窓会',
    dateStart: toDatetimeLocal(new Date('2026-05-20T19:00').toISOString()),
    dateEnd: toDatetimeLocal(new Date('2026-05-20T21:30').toISOString()),
    placePublic: '六本木エリア',
    place: '港区六本木4-5-6 タワー8F',
    capacity: '30',
    detail: '📍 港区六本木4-5-6 タワー8F ／ 💰 3,500円（当日精算）／ 🥂 軽食・ドリンク付き',
  })
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 認証ステップ
  const [step, setStep] = useState<'form' | 'email' | 'otp'>('form')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)

  function validate() {
    const e: Partial<Record<string, string>> = {}
    if (!form.title.trim()) e.title = 'イベント名は必須です'
    if (!form.community.trim()) e.community = 'コミュニティ名は必須です'
    if (!form.dateStart) e.dateStart = '開始日時は必須です'
    if (!form.placePublic.trim()) e.placePublic = '公開用の場所は必須です'
    if (!form.place.trim()) e.place = '実際の場所・住所は必須です'
    if (!form.capacity.trim()) {
      e.capacity = '定員は必須です'
    } else if (isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      e.capacity = '定員は1以上の数値で入力してください'
    }
    return e
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'dateStart' && value) {
        if (!prev.dateEnd || prev.dateEnd <= value) {
          next.dateEnd = value
        }
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    if (isDev) {
      await doCreateEvent()
      return
    }

    // 本番: ログイン済みか確認
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await doCreateEvent()
    } else {
      setStep('email')
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSendingOtp(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email: organizerEmail.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })
    setSendingOtp(false)
    if (error) {
      if (error.message.includes('rate limit')) {
        setErrorMsg('送信回数の上限に達しました。しばらく待ってから再試行してください。')
      } else {
        setErrorMsg(`確認コードの送信に失敗しました：${error.message}`)
      }
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpVerifying(true)
    setOtpError('')
    const { error } = await supabase.auth.verifyOtp({
      email: organizerEmail.trim().toLowerCase(),
      token: otp,
      type: 'email',
    })
    if (error) {
      setOtpError('コードが正しくありません。もう一度お試しください。')
      setOtpVerifying(false)
      return
    }
    await doCreateEvent()
    setOtpVerifying(false)
  }

  async function doCreateEvent() {
    setSubmitting(true)
    setErrorMsg('')

    try {
      // 幹事のメアドと名前を取得
      let email: string
      let name: string
      let extraFields: Record<string, unknown> = {}

      if (isDev) {
        const account = getTestAccount()
        if (!account || account.role !== 'organizer') {
          setErrorMsg('幹事アカウントでログインしてください')
          setSubmitting(false)
          return
        }
        email = account.email
        name = account.name
        extraFields = {
          graduation_year: account.graduation_year,
          major: account.major,
          company: account.company,
          job_title: account.job_title,
          bio: account.bio,
          avatar_color: account.avatar_color,
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) {
          setErrorMsg('ログインが必要です')
          setSubmitting(false)
          return
        }
        email = user.email
        name = user.email.split('@')[0]
      }

      // コミュニティを取得または作成
      let community = await getDefaultCommunity()
      if (!community || community.name !== form.community.trim()) {
        const { data: found } = await supabase
          .from('communities')
          .select('*')
          .ilike('name', form.community.trim())
          .single()

        if (found) {
          community = found
        } else {
          const { data: created } = await supabase
            .from('communities')
            .insert({
              name: form.community.trim(),
              slug: form.community.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now(),
              admin_email: email,
              is_private: true,
            })
            .select()
            .single()
          community = created
        }
      }

      if (!community) {
        setErrorMsg('コミュニティの作成に失敗しました')
        setSubmitting(false)
        return
      }

      // 幹事メンバーを取得または作成
      const member = await getOrCreateMember(community.id, {
        name,
        email,
        ...extraFields,
      })

      if (!member) {
        setErrorMsg('メンバー情報の取得に失敗しました')
        setSubmitting(false)
        return
      }

      // イベント作成
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          community_id: community.id,
          title: form.title.trim(),
          date_start: new Date(form.dateStart).toISOString(),
          date_end: form.dateEnd ? new Date(form.dateEnd).toISOString() : null,
          place_public: form.placePublic.trim(),
          place_private: form.place.trim(),
          capacity: Number(form.capacity),
          detail: form.detail.trim() || null,
          status: 'open',
        })
        .select()
        .single()

      if (eventError || !event) {
        setErrorMsg('イベントの作成に失敗しました: ' + (eventError?.message || ''))
        setSubmitting(false)
        return
      }

      // 幹事としてevent_membersに登録
      await supabase.from('event_members').insert({
        event_id: event.id,
        member_id: member.id,
        role: 'organizer',
      })

      // リマインド登録
      if (reminderEnabled && form.dateStart) {
        const eventDate = new Date(form.dateStart)
        const [h, m] = reminderTime.split(':').map(Number)
        const remindAt = new Date(eventDate)
        remindAt.setDate(remindAt.getDate() - 1)
        remindAt.setHours(h, m, 0, 0)
        await supabase.from('reminders').insert({
          event_id: event.id,
          remind_at: remindAt.toISOString(),
          channel: 'email',
          status: 'pending',
        })
      }

      router.push('/dashboard')
    } catch (err) {
      setErrorMsg('エラーが発生しました：' + (err instanceof Error ? err.message : String(err)))
      setSubmitting(false)
    }
  }

  // メールアドレス入力ステップ
  if (step === 'email') {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-xl" style={{ background: '#f0f4ff' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#1a1a1a' }}>
            メールアドレスを確認します
          </p>
          <p className="text-xs" style={{ color: '#555' }}>
            イベント作成のため、あなたのメールアドレスに確認コードを送ります
          </p>
        </div>

        <div className="p-3 rounded-xl text-xs" style={{ background: '#fff9e6', color: '#b8860b' }}>
          この確認は、このアプリを初めて使う<span className="font-bold">今回だけ</span>です。
          次回からは自動でログインされます。
        </div>

        <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
          <div>
            <label className="label">メールアドレス</label>
            <input
              type="email"
              className="input-field"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>
          {errorMsg && (
            <p className="text-xs" style={{ color: '#ff4d4f' }}>{errorMsg}</p>
          )}
          <button type="submit" disabled={!organizerEmail || sendingOtp} className="btn-primary">
            {sendingOtp ? '送信中...' : '確認コードを送る'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('form'); setErrorMsg('') }}
            className="text-xs text-center"
            style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← フォームに戻る
          </button>
        </form>
      </div>
    )
  }

  // OTP入力ステップ
  if (step === 'otp') {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-xl" style={{ background: '#e6f9ee' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#06C755' }}>
            確認コードを送信しました ✉️
          </p>
          <p className="text-xs" style={{ color: '#555' }}>
            <span className="font-bold">{organizerEmail}</span> に8桁のコードをお送りしました
          </p>
        </div>

        <div className="p-3 rounded-xl text-xs" style={{ background: '#fff9e6', color: '#b8860b' }}>
          この確認は、このアプリを初めて使う<span className="font-bold">今回だけ</span>です。
          次回からは自動でログインされます。
        </div>

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            className="input-field text-center text-2xl font-bold tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="00000000"
            required
            autoFocus
          />
          {otpError && (
            <p className="text-xs" style={{ color: '#ff4d4f' }}>{otpError}</p>
          )}
          <button
            type="submit"
            disabled={otp.length < 6 || otpVerifying || submitting}
            className="btn-primary"
          >
            {otpVerifying || submitting ? '確認中...' : '確認してイベントを作成する'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setOtp(''); setOtpError('') }}
            className="text-xs text-center"
            style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← メールアドレスを変更する
          </button>
        </form>
      </div>
    )
  }

  // 通常フォーム
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-3 rounded-xl text-sm" style={{ background: '#fff0f0', color: '#ff4d4f' }}>
          {errorMsg}
        </div>
      )}

      <div>
        <label className="label">イベント名 *</label>
        <input name="title" className="input-field" value={form.title} onChange={handleChange} placeholder="例：MBA卒業生 春の交流会2026" />
        {errors.title && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.title}</p>}
      </div>

      <div>
        <label className="label">コミュニティ名 *</label>
        <input name="community" className="input-field" value={form.community} onChange={handleChange} placeholder="例：MBA同窓会" />
        {errors.community && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.community}</p>}
      </div>

      <div>
        <label className="label">開始日時 *</label>
        <input name="dateStart" type="datetime-local" className="input-field" value={form.dateStart} onChange={handleChange} />
        {errors.dateStart && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.dateStart}</p>}
      </div>

      <div>
        <label className="label">終了日時（任意）</label>
        <input name="dateEnd" type="datetime-local" className="input-field" value={form.dateEnd} onChange={handleChange} min={form.dateStart} />
      </div>

      <div>
        <label className="label">公開用の場所 *</label>
        <input name="placePublic" className="input-field" value={form.placePublic} onChange={handleChange} placeholder="例：渋谷エリア（参加者全員に公開）" />
        {errors.placePublic && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.placePublic}</p>}
      </div>

      <div>
        <label className="label">実際の場所・住所 *</label>
        <input name="place" className="input-field" value={form.place} onChange={handleChange} placeholder="例：渋谷区道玄坂1-2-3 ビル5F（参加確定者のみに公開）" />
        {errors.place && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.place}</p>}
      </div>

      <div>
        <label className="label">定員 *</label>
        <input name="capacity" type="number" min={1} className="input-field" value={form.capacity} onChange={handleChange} placeholder="例：20" />
        {errors.capacity && <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>{errors.capacity}</p>}
      </div>

      <div>
        <label className="label">参加確定者のみに届く詳細情報（任意）</label>
        <textarea name="detail" className="input-field" value={form.detail} onChange={handleChange} rows={3} placeholder="例：📍 渋谷区道玄坂1-2-3 ビル5F ／ 💰 4,000円（当日精算）" style={{ resize: 'vertical' }} />
      </div>

      <div className="p-3 rounded-xl" style={{ background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            style={{ accentColor: '#06C755', width: 18, height: 18 }}
          />
          <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
            前日のリマインドメールを送る
          </span>
        </label>
        {reminderEnabled && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm" style={{ color: '#555' }}>送信時刻</label>
            <input type="time" className="input-field" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} style={{ width: 'auto' }} />
            <span className="text-xs" style={{ color: '#888' }}>イベント前日のこの時刻に全参加者へ送信</span>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? '作成中...' : 'イベントを作成する'}
      </button>
    </form>
  )
}
