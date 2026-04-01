'use client'

import { useState } from 'react'
import { supabase, getTestAccount, getDefaultCommunity } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16)
}

export default function EventForm() {
  const router = useRouter()
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
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const account = getTestAccount()
      if (!account || account.role !== 'organizer') {
        setErrorMsg('幹事アカウントでログインしてください')
        setSubmitting(false)
        return
      }

      // Find or create community
      let community = await getDefaultCommunity()
      if (!community || community.name !== form.community.trim()) {
        // Try to find by name
        const { data: found } = await supabase
          .from('communities')
          .select('*')
          .ilike('name', form.community.trim())
          .single()

        if (found) {
          community = found
        } else {
          // Create new community
          const { data: created } = await supabase
            .from('communities')
            .insert({
              name: form.community.trim(),
              slug: form.community.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now(),
              admin_email: account.email,
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

      // Find or create organizer member
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('email', account.email)
        .eq('community_id', community.id)
        .single()

      let memberId = member?.id
      if (!memberId) {
        const { data: created } = await supabase
          .from('members')
          .insert({
            community_id: community.id,
            name: account.name,
            email: account.email,
            graduation_year: account.graduation_year,
            major: account.major,
            company: account.company,
            job_title: account.job_title,
            bio: account.bio,
            avatar_color: account.avatar_color,
            status: 'approved',
          })
          .select()
          .single()
        memberId = created?.id
      }

      if (!memberId) {
        setErrorMsg('メンバー情報の取得に失敗しました')
        setSubmitting(false)
        return
      }

      // Create event
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

      // Add organizer to event_members
      await supabase.from('event_members').insert({
        event_id: event.id,
        member_id: memberId,
        role: 'organizer',
      })

      router.push('/dashboard')
    } catch (err) {
      setErrorMsg('エラーが発生しました。Supabaseの設定を確認してください。')
      setSubmitting(false)
    }
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
        <label className="label">イベント名 *</label>
        <input
          name="title"
          className="input-field"
          value={form.title}
          onChange={handleChange}
          placeholder="例：MBA卒業生 春の交流会2026"
        />
        {errors.title && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label className="label">コミュニティ名 *</label>
        <input
          name="community"
          className="input-field"
          value={form.community}
          onChange={handleChange}
          placeholder="例：MBA同窓会"
        />
        {errors.community && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.community}
          </p>
        )}
      </div>

      <div>
        <label className="label">開始日時 *</label>
        <input
          name="dateStart"
          type="datetime-local"
          className="input-field"
          value={form.dateStart}
          onChange={handleChange}
        />
        {errors.dateStart && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.dateStart}
          </p>
        )}
      </div>

      <div>
        <label className="label">終了日時（任意）</label>
        <input
          name="dateEnd"
          type="datetime-local"
          className="input-field"
          value={form.dateEnd}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="label">公開用の場所 *</label>
        <input
          name="placePublic"
          className="input-field"
          value={form.placePublic}
          onChange={handleChange}
          placeholder="例：渋谷エリア（参加者全員に公開）"
        />
        {errors.placePublic && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.placePublic}
          </p>
        )}
      </div>

      <div>
        <label className="label">実際の場所・住所 *</label>
        <input
          name="place"
          className="input-field"
          value={form.place}
          onChange={handleChange}
          placeholder="例：渋谷区道玄坂1-2-3 ビル5F（参加確定者のみに公開）"
        />
        {errors.place && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.place}
          </p>
        )}
      </div>

      <div>
        <label className="label">定員 *</label>
        <input
          name="capacity"
          type="number"
          min={1}
          className="input-field"
          value={form.capacity}
          onChange={handleChange}
          placeholder="例：20"
        />
        {errors.capacity && (
          <p className="text-xs mt-1" style={{ color: '#ff4d4f' }}>
            {errors.capacity}
          </p>
        )}
      </div>

      <div>
        <label className="label">参加確定者のみに届く詳細情報（任意）</label>
        <textarea
          name="detail"
          className="input-field"
          value={form.detail}
          onChange={handleChange}
          rows={3}
          placeholder="例：📍 渋谷区道玄坂1-2-3 ビル5F ／ 💰 4,000円（当日精算）"
          style={{ resize: 'vertical' }}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? '作成中...' : 'イベントを作成する'}
      </button>
    </form>
  )
}
