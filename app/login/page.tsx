'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  // 既にログイン済みならリダイレクト
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next)
    })
  }, [next, router])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Email rate limit')) {
        setError('送信回数の上限に達しました。しばらく待ってから再試行してください。')
      } else {
        setError(`送信に失敗しました：${error.message}`)
      }
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) {
      setError('コードが正しくありません。もう一度お試しください。')
    } else {
      router.replace(next)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">🔐</p>
        <h1 className="text-xl font-black" style={{ color: '#1a1a1a' }}>
          簡単ログイン
        </h1>
        <p className="text-sm mt-1" style={{ color: '#888' }}>
          メールアドレスの登録だけで完了します
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="card">
          <label className="label">メールアドレス</label>
          <input
            type="email"
            className="input-field mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoFocus
          />
          {error && (
            <p className="text-xs mb-3" style={{ color: '#ff4d4f' }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={!email || loading} className="btn-primary">
            {loading ? '送信中...' : '確認コードを送る'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="card">
          <p className="text-sm mb-4" style={{ color: '#555' }}>
            <span className="font-bold">{email}</span>{' '}
            に送信した8桁のコードを入力してください
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            className="input-field mb-4 text-center text-2xl font-bold tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="00000000"
            required
            autoFocus
          />
          {error && (
            <p className="text-xs mb-3" style={{ color: '#ff4d4f' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={otp.length < 6 || loading}
            className="btn-primary"
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setOtp('')
              setError('')
            }}
            className="w-full text-center text-xs mt-3"
            style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            メールアドレスを変更する
          </button>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
