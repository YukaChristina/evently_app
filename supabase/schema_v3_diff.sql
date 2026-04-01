-- ============================================
-- Evently v3 差分SQL
-- Supabase SQL Editor で実行してください
-- ============================================

-- チャット既読管理（新規追加）
CREATE TABLE IF NOT EXISTS chat_reads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  read_at     TIMESTAMP DEFAULT now(),
  UNIQUE(message_id, member_id)
);

-- アナウンス（幹事から全員への重要連絡）（新規追加）
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id),     -- 投稿した幹事
  title       TEXT,
  body        TEXT NOT NULL,
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT now()
);

-- RLS 有効化
ALTER TABLE chat_reads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- anon キーで全操作を許可（テスト用）
CREATE POLICY "allow_all_chat_reads"    ON chat_reads    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_announcements" ON announcements FOR ALL TO anon USING (true) WITH CHECK (true);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
