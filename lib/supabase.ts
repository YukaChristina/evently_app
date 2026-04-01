import { createClient } from '@supabase/supabase-js'
import { TEST_ACCOUNTS, TEST_ORGANIZERS, TEST_PARTICIPANTS, TestAccount } from './testAccounts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- Database Types ----

export type Community = {
  id: string
  name: string
  slug: string
  admin_email: string
  is_private: boolean
  created_at: string
}

export type Member = {
  id: string
  community_id: string
  auth_user_id: string | null
  name: string
  email: string | null
  line_user_id: string | null
  notify_method: 'line' | 'email' | 'both'
  graduation_year: number | null
  major: string | null
  company: string | null
  job_title: string | null
  bio: string | null
  avatar_color: string | null
  status: 'pending' | 'approved'
  applied_at: string
  approved_at: string | null
  approved_by: string | null
}

export type Event = {
  id: string
  community_id: string
  title: string
  date_start: string
  date_end: string | null
  place_public: string | null
  place_private: string | null
  detail: string | null
  capacity: number | null
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
}

export type EventMember = {
  id: string
  event_id: string
  member_id: string
  role: 'organizer' | 'participant'
  joined_at: string
}

export type ChatMessage = {
  id: string
  event_id: string
  member_id: string
  body: string
  sent_at: string
  members?: Member
}

export type Feedback = {
  id: string
  event_id: string
  member_id: string | null
  rating: 'good' | 'okay' | 'bad' | null
  comment: string | null
  created_at: string
}

export type ChatRead = {
  id: string
  message_id: string
  member_id: string
  read_at: string
}

export type Announcement = {
  id: string
  event_id: string
  member_id: string
  title: string | null
  body: string
  is_pinned: boolean
  created_at: string
  member?: Member
}

// ---- Test Account Helpers ----

export function getTestAccount(): TestAccount | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem('evently_test_account')
    if (!stored) return null
    return JSON.parse(stored) as TestAccount
  } catch {
    return null
  }
}

export function setTestAccount(account: TestAccount): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('evently_test_account', JSON.stringify(account))
}

// ---- Community Helpers ----

export async function getDefaultCommunity(): Promise<Community | null> {
  const { data } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  return data
}

// ---- Member Helpers ----

export async function getCurrentMember(communityId: string): Promise<Member | null> {
  let email: string | null = null

  if (process.env.NEXT_PUBLIC_ENV === 'development') {
    // 開発環境: テストアカウントを使う
    const account = getTestAccount()
    if (!account) return null
    email = account.email
  } else {
    // 本番環境: Supabase Auth から取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return null
    email = user.email

    // members に auth_user_id が未設定なら紐づける
    const { data: existing } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .eq('community_id', communityId)
      .single()
    if (existing && !existing.auth_user_id) {
      await supabase
        .from('members')
        .update({ auth_user_id: user.id })
        .eq('id', existing.id)
      return { ...existing, auth_user_id: user.id }
    }
    return existing
  }

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .eq('community_id', communityId)
    .single()
  return data
}

export async function getOrCreateMember(
  communityId: string,
  memberData: {
    name: string
    email: string
    graduation_year?: number | null
    major?: string | null
    company?: string | null
    job_title?: string | null
    avatar_color?: string | null
  }
): Promise<Member | null> {
  // upsert: email+community_id が重複したら既存レコードを返す
  const { data, error } = await supabase
    .from('members')
    .upsert(
      {
        community_id: communityId,
        name: memberData.name,
        email: memberData.email,
        graduation_year: memberData.graduation_year ?? null,
        major: memberData.major ?? null,
        company: memberData.company ?? null,
        job_title: memberData.job_title ?? null,
        avatar_color: memberData.avatar_color ?? null,
        status: 'approved',
      },
      { onConflict: 'community_id,email', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) {
    console.error('getOrCreateMember error:', error)
    // upsertが失敗した場合は既存レコードを取得
    const { data: existing } = await supabase
      .from('members')
      .select('*')
      .eq('email', memberData.email)
      .eq('community_id', communityId)
      .single()
    return existing
  }

  return data
}

// ---- Event Helpers ----

export async function getMyRole(
  eventId: string,
  memberId: string
): Promise<'organizer' | 'participant' | null> {
  const { data } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .single()
  return (data?.role as 'organizer' | 'participant') ?? null
}

export async function getEventParticipants(
  eventId: string
): Promise<(EventMember & { member: Member })[]> {
  const { data } = await supabase
    .from('event_members')
    .select('*, member:members(*)')
    .eq('event_id', eventId)
    .eq('role', 'participant')
    .order('joined_at', { ascending: true })
  return (data as unknown as (EventMember & { member: Member })[]) ?? []
}

export async function getOrganizerEvents(memberId: string): Promise<Event[]> {
  const { data: eventMembers } = await supabase
    .from('event_members')
    .select('event_id')
    .eq('member_id', memberId)
    .eq('role', 'organizer')

  if (!eventMembers || eventMembers.length === 0) return []

  const eventIds = eventMembers.map((em) => em.event_id)

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('created_at', { ascending: false })

  return events ?? []
}

export async function getParticipantEvents(memberId: string): Promise<Event[]> {
  const { data: eventMembers } = await supabase
    .from('event_members')
    .select('event_id')
    .eq('member_id', memberId)
    .eq('role', 'participant')

  if (!eventMembers || eventMembers.length === 0) return []

  const eventIds = eventMembers.map((em) => em.event_id)

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('date_start', { ascending: true })

  return events ?? []
}

// ---- Chat Read Helpers ----

export async function markMessagesAsRead(
  messageIds: string[],
  memberId: string
): Promise<void> {
  if (messageIds.length === 0) return
  const inserts = messageIds.map((message_id) => ({ message_id, member_id: memberId }))
  await supabase
    .from('chat_reads')
    .upsert(inserts, { onConflict: 'message_id,member_id', ignoreDuplicates: true })
}

export async function getReadCounts(
  messageIds: string[]
): Promise<Record<string, number>> {
  if (messageIds.length === 0) return {}
  const { data } = await supabase
    .from('chat_reads')
    .select('message_id')
    .in('message_id', messageIds)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.message_id] = (counts[row.message_id] ?? 0) + 1
  }
  return counts
}

// ---- Event Member Helpers ----

export async function getAllEventMembers(eventId: string): Promise<Member[]> {
  const { data } = await supabase
    .from('event_members')
    .select('member:members(*)')
    .eq('event_id', eventId)
  return ((data ?? []) as unknown as { member: Member }[]).map((d) => d.member)
}

// ---- Date Formatting ----

export function formatDateJa(dateStart: string, dateEnd?: string | null): string {
  try {
    const s = new Date(dateStart)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const base = `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日（${days[s.getDay()]}）${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`
    if (!dateEnd) return base
    const e = new Date(dateEnd)
    return `${base}〜${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`
  } catch {
    return dateStart
  }
}

// ---- Demo Data Init ----

export async function initDemoData(): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return

  const { data: existing } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', 'mba-alumni')
    .single()

  if (existing) return

  // Create community
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .insert({
      name: 'MBA同窓会',
      slug: 'mba-alumni',
      admin_email: 'admin@test.com',
      is_private: true,
    })
    .select()
    .single()

  if (communityError || !community) return

  // Create members for all test accounts
  const memberInserts = TEST_ACCOUNTS.map((account) => ({
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
  }))

  const { data: members, error: membersError } = await supabase
    .from('members')
    .insert(memberInserts)
    .select()

  if (membersError || !members) return

  const emailToMember: Record<string, Member> = {}
  for (const m of members as Member[]) {
    if (m.email) emailToMember[m.email] = m
  }

  // Create demo event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      community_id: community.id,
      title: 'MBA同窓生 春の交流会2026',
      date_start: '2026-04-15T19:00:00+09:00',
      date_end: '2026-04-15T21:00:00+09:00',
      place_public: '渋谷エリア',
      place_private: '渋谷区道玄坂1-2-3 ビル5F',
      detail: '📍 渋谷区道玄坂1-2-3 ビル5F ｜ 💰 4,000円（当日精算）｜ 👔 平服でお越しください',
      capacity: 20,
      status: 'open',
    })
    .select()
    .single()

  if (eventError || !event) return

  // Add event_members
  const organizerInserts = TEST_ORGANIZERS
    .filter((org) => emailToMember[org.email])
    .map((org) => ({
      event_id: event.id,
      member_id: emailToMember[org.email].id,
      role: 'organizer',
    }))

  const participantInserts = TEST_PARTICIPANTS
    .filter((p) => emailToMember[p.email])
    .map((p) => ({
      event_id: event.id,
      member_id: emailToMember[p.email].id,
      role: 'participant',
    }))

  await supabase.from('event_members').insert([...organizerInserts, ...participantInserts])

  // Add demo chat messages
  const org1 = emailToMember['organizer1@test.com']
  const p1 = emailToMember['p1@test.com']
  const p2 = emailToMember['p2@test.com']

  if (org1 && p1 && p2) {
    await supabase.from('chat_messages').insert([
      { event_id: event.id, member_id: p1.id, body: '楽しみにしています！どんな方が参加されますか？' },
      { event_id: event.id, member_id: p2.id, body: '私も気になってます！幹事さんよろしくお願いします' },
      { event_id: event.id, member_id: org1.id, body: 'ご参加ありがとうございます！当日が楽しみですね😊' },
    ])
  }
}
