import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import TestLoginBar from '@/components/TestLoginBar'

export const metadata: Metadata = {
  title: 'Evently',
  description: 'イベント管理・参加申込アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="app-container">
          <TestLoginBar />
          <Header />
          {children}
        </div>
      </body>
    </html>
  )
}
