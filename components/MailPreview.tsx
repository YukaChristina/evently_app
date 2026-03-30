'use client'

type MailPreviewProps = {
  subject: string
  body: string
  eventUrl: string
}

export default function MailPreview({ subject, body, eventUrl }: MailPreviewProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1.5px solid #e0e0e0',
        background: '#fafafa',
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      {/* Email Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ background: '#f0f0f0', borderColor: '#e0e0e0' }}
      >
        <div className="flex gap-1 mb-2">
          <span
            className="rounded-full inline-block"
            style={{ width: 10, height: 10, background: '#ff5f57' }}
          />
          <span
            className="rounded-full inline-block"
            style={{ width: 10, height: 10, background: '#ffbd2e' }}
          />
          <span
            className="rounded-full inline-block"
            style={{ width: 10, height: 10, background: '#28c940' }}
          />
        </div>
        <p className="text-xs" style={{ color: '#888' }}>
          From: noreply@evently.jp
        </p>
        <p className="text-xs" style={{ color: '#888' }}>
          To: あなた
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: '#1a1a1a' }}>
          件名：{subject}
        </p>
      </div>

      {/* Email Body */}
      <div className="px-4 py-3">
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: '#333', lineHeight: 1.7 }}
        >
          {body}
        </p>
        {eventUrl && (
          <p
            className="text-sm mt-3 break-all"
            style={{ color: '#06C755' }}
          >
            {eventUrl}
          </p>
        )}
      </div>
    </div>
  )
}
