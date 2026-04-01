import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'Evently <noreply@evently.app>'

type EmailPayload =
  | {
      type: 'join-confirmation'
      to: string
      memberName: string
      eventTitle: string
      dateStr: string
      placePrivate: string
      detail: string | null
      eventUrl: string
      chatUrl: string
    }
  | {
      type: 'chat-notification'
      to: string[]
      senderName: string
      eventTitle: string
      bodyPreview: string
      chatUrl: string
    }
  | {
      type: 'announcement'
      to: string[]
      eventTitle: string
      announcementTitle: string | null
      announcementBody: string
      eventUrl: string
    }
  | {
      type: 'reminder'
      to: string[]
      eventTitle: string
      dateStr: string
      placePublic: string
      participantCount: number
      eventUrl: string
      chatUrl: string
    }

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key') {
    console.log('[Mock Email]', { to, subject })
    return { ok: true, mock: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })
  return res
}

function baseHtml(content: string) {
  return `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;color:#06C755;">Evently</span>
      </div>
      ${content}
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:32px;">
        このメールはEventlyから自動送信されています
      </p>
    </div>
  `
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as EmailPayload

  try {
    if (payload.type === 'join-confirmation') {
      const subject = `参加確定 - ${payload.eventTitle}`
      const html = baseHtml(`
        <div style="background:#e6f9ee;border:2px solid #06C755;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px;">
          <div style="font-size:36px;margin-bottom:8px;">🎉</div>
          <h1 style="color:#06C755;font-size:20px;margin:0;">参加が確定しました！</h1>
          <p style="color:#00A040;margin:4px 0 0;">${payload.eventTitle}</p>
        </div>
        <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#333;">📅 ${payload.dateStr}</p>
          <p style="margin:0 0 8px;color:#333;">📍 ${payload.placePrivate}</p>
          ${payload.detail ? `<p style="margin:8px 0 0;color:#555;white-space:pre-wrap;">${payload.detail}</p>` : ''}
        </div>
        <p style="color:#555;margin-bottom:16px;">参加者同士のチャットもご利用ください！</p>
        <a href="${payload.eventUrl}" style="display:block;background:#06C755;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;margin-bottom:10px;">
          イベントページを見る
        </a>
        <a href="${payload.chatUrl}" style="display:block;background:#fff;color:#45B7D1;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;border:1.5px solid #45B7D1;">
          💬 チャットを見る
        </a>
      `)
      await sendEmail(payload.to, subject, html)
    }

    else if (payload.type === 'chat-notification') {
      const subject = `💬 ${payload.senderName}さんがチャットに投稿しました`
      const html = baseHtml(`
        <h2 style="color:#1a1a1a;font-size:16px;margin-bottom:4px;">${payload.eventTitle}</h2>
        <div style="background:#f0f4f8;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="font-weight:bold;color:#333;margin:0 0 4px;">${payload.senderName}</p>
          <p style="color:#555;margin:0;">${payload.bodyPreview}</p>
        </div>
        <a href="${payload.chatUrl}" style="display:block;background:#45B7D1;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;">
          💬 チャットを見る
        </a>
      `)
      await sendEmail(payload.to, subject, html)
    }

    else if (payload.type === 'announcement') {
      const subject = `📢 【${payload.eventTitle}】お知らせがあります`
      const html = baseHtml(`
        <h2 style="color:#1a1a1a;font-size:16px;margin-bottom:4px;">${payload.eventTitle}</h2>
        ${payload.announcementTitle ? `<h3 style="color:#333;margin-bottom:8px;">${payload.announcementTitle}</h3>` : ''}
        <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="color:#333;margin:0;white-space:pre-wrap;">${payload.announcementBody}</p>
        </div>
        <a href="${payload.eventUrl}" style="display:block;background:#06C755;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;">
          イベントページを見る
        </a>
      `)
      await sendEmail(payload.to, subject, html)
    }

    else if (payload.type === 'reminder') {
      const subject = `明日開催 - ${payload.eventTitle}`
      const html = baseHtml(`
        <div style="background:#e6f9ee;border-radius:16px;padding:16px;text-align:center;margin-bottom:20px;">
          <div style="font-size:36px;">📅</div>
          <h1 style="color:#06C755;font-size:18px;margin:8px 0 0;">明日はいよいよ本番です！</h1>
        </div>
        <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#333;font-weight:bold;">${payload.eventTitle}</p>
          <p style="margin:0 0 8px;color:#333;">📅 ${payload.dateStr}</p>
          <p style="margin:0 0 8px;color:#333;">📍 ${payload.placePublic}</p>
          <p style="margin:0;color:#06C755;font-weight:bold;">参加者：現在${payload.participantCount}名</p>
        </div>
        <a href="${payload.eventUrl}" style="display:block;background:#06C755;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;margin-bottom:10px;">
          イベントページを見る
        </a>
        <a href="${payload.chatUrl}" style="display:block;background:#fff;color:#45B7D1;text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-weight:bold;border:1.5px solid #45B7D1;">
          💬 チャットを見る
        </a>
      `)
      await sendEmail(payload.to, subject, html)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('send-email error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
