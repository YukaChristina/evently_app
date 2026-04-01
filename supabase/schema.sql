-- ============================================
-- Evently v2 Schema
-- Supabase (PostgreSQL) に実行してください
-- ============================================

-- コミュニティ
CREATE TABLE communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  admin_email   TEXT NOT NULL,
  is_private    BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT now()
);

-- メンバー
CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES communities(id),
  auth_user_id    UUID,
  name            TEXT NOT NULL,
  email           TEXT,
  line_user_id    TEXT,
  notify_method   TEXT DEFAULT 'email',
  graduation_year INTEGER,
  major           TEXT,
  company         TEXT,
  job_title       TEXT,
  bio             TEXT,
  avatar_color    TEXT,
  status          TEXT DEFAULT 'approved',
  applied_at      TIMESTAMP DEFAULT now(),
  approved_at     TIMESTAMP,
  approved_by     UUID REFERENCES members(id),
  UNIQUE(community_id, email)
);

-- イベント
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID REFERENCES communities(id),
  title         TEXT NOT NULL,
  date_start    TIMESTAMP NOT NULL,
  date_end      TIMESTAMP,
  place_public  TEXT,
  place_private TEXT,
  detail        TEXT,
  capacity      INTEGER,
  status        TEXT DEFAULT 'open',
  created_at    TIMESTAMP DEFAULT now()
);

-- イベントメンバー（幹事 or 参加者）
CREATE TABLE event_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES events(id),
  member_id   UUID REFERENCES members(id),
  role        TEXT NOT NULL,
  joined_at   TIMESTAMP DEFAULT now(),
  UNIQUE(event_id, member_id, role)
);

-- チャット
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES events(id),
  member_id   UUID REFERENCES members(id),
  body        TEXT NOT NULL,
  sent_at     TIMESTAMP DEFAULT now()
);

-- LINEグループ（将来拡張）
CREATE TABLE line_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id),
  line_group_id   TEXT,
  invite_link     TEXT,
  created_at      TIMESTAMP DEFAULT now()
);

-- リマインド管理
CREATE TABLE reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES events(id),
  remind_at   TIMESTAMP NOT NULL,
  channel     TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  sent_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT now()
);

-- フィードバック（テスト収集用）
CREATE TABLE feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES events(id),
  member_id   UUID REFERENCES members(id),
  rating      TEXT,
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security) - 開発中は全許可
-- ============================================
ALTER TABLE communities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks     ENABLE ROW LEVEL SECURITY;

-- anon キーで全操作を許可（テスト用・本番では絞ること）
CREATE POLICY "allow_all_communities"   ON communities   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_members"       ON members       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_events"        ON events        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_event_members" ON event_members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chat_messages" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_line_groups"   ON line_groups   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reminders"     ON reminders     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_feedbacks"     ON feedbacks     FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- Realtime 有効化（chat_messages テーブル）
-- ============================================
-- Supabase Dashboard > Database > Replication で
-- chat_messages テーブルを Realtime 対象に追加してください
