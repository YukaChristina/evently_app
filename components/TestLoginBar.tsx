'use client'

import { useState, useEffect } from 'react'
import { TEST_ACCOUNTS, TestAccount } from '@/lib/testAccounts'
import { getTestAccount, setTestAccount } from '@/lib/supabase'

export default function TestLoginBar() {
  const [currentAccount, setCurrentAccount] = useState<TestAccount | null>(null)

  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'

  useEffect(() => {
    const account = getTestAccount()
    if (!account && TEST_ACCOUNTS.length > 0) {
      setTestAccount(TEST_ACCOUNTS[0])
      setCurrentAccount(TEST_ACCOUNTS[0])
    } else {
      setCurrentAccount(account)
    }
  }, [])

  if (!isDev) return null

  function handleSelect(account: TestAccount) {
    setTestAccount(account)
    setCurrentAccount(account)
    window.location.reload()
  }

  return (
    <div
      className="sticky top-0 z-50 px-3 py-2"
      style={{ background: '#1a1a2e', borderBottom: '2px solid #333' }}
    >
      <p className="text-xs font-bold mb-1.5" style={{ color: '#aaa' }}>
        テストモード ログイン切替：
      </p>
      <div className="flex flex-wrap gap-1">
        {TEST_ACCOUNTS.map((account) => {
          const isActive = currentAccount?.id === account.id
          const isOrganizer = account.role === 'organizer'
          return (
            <button
              key={account.id}
              onClick={() => handleSelect(account)}
              className="text-xs px-2 py-1 rounded-full font-bold"
              style={{
                background: isActive ? '#06C755' : isOrganizer ? '#2d2d4e' : '#2d3d2d',
                color: isActive ? '#fff' : '#ccc',
                border: isActive ? '2px solid #06C755' : '1px solid #444',
                cursor: 'pointer',
              }}
            >
              {account.name.split(' ')[0]}
            </button>
          )
        })}
      </div>
      {currentAccount && (
        <p className="text-xs mt-1" style={{ color: '#777' }}>
          現在: {currentAccount.name}（{currentAccount.role === 'organizer' ? '幹事' : '参加者'}）
        </p>
      )}
    </div>
  )
}
