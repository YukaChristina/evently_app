# Evently - CLAUDE.md

## プロジェクト概要
コミュニティのイベント幹事の作業負担をほぼゼロにするイベント管理WebアプリのTypeScript実装。
想定ユーザー：ビジネススクール同窓会・社会人コミュニティ・業界勉強会などのセミフォーマルなコミュニティ。

## 技術スタック
- フロントエンド：Next.js 14 (App Router) + TailwindCSS + TypeScript
- データ保存：Supabase（PostgreSQL + Realtime）
- 認証：Supabase Auth（メールOTP／パスワードレス）
- メール送信：Resend API（未設定時はコンソールログのみ）
- デプロイ：Vercel（GitHub連携、ブランチ：master）

## ディレクトリ構成
```
evently_app/
├── app/
│   ├── page.tsx               # ホーム画面（認証不要・ナビゲーション）
│   ├── login/page.tsx         # ログイン画面（メールOTP 2ステップ・ダッシュボード直アクセス時のみ使用）
│   ├── dashboard/page.tsx     # マイイベント一覧（認証保護済み・幹事カード＋参加者カード）
│   ├── create/page.tsx        # イベント作成画面（認証不要・送信時にインラインOTP）
│   ├── event/[id]/page.tsx    # イベント詳細ページ（公開・ロール別表示）
│   ├── join/[id]/page.tsx     # 参加申込画面（認証不要・送信時にインラインOTP）
│   ├── join-done/page.tsx     # 参加確定画面
│   ├── chat/[id]/page.tsx     # 参加者チャット画面（認証保護済み）
│   ├── api/send-email/route.ts # メール送信API（Resend）
│   └── layout.tsx             # 共通レイアウト（Header + TestLoginBar）
├── components/
│   ├── Header.tsx             # 共通ヘッダー（ロゴ・マイイベントリンク・ログアウトボタン）
│   ├── TestLoginBar.tsx       # 開発環境専用テストアカウント切替バー
│   ├── EventForm.tsx          # イベント作成フォーム（日時自動補完・リマインダー・インラインOTP）
│   ├── JoinForm.tsx           # 参加申込フォーム（auth情報から自動入力・インラインOTP）
│   ├── ChatBox.tsx            # チャットUI（Realtime購読・既読件数表示）
│   ├── ParticipantList.tsx    # 参加者一覧
│   └── StatusBar.tsx          # 残席数バー
└── lib/
    ├── supabase.ts            # Supabaseクライアント・DB型定義・ヘルパー関数群
    ├── useRequireAuth.ts      # 認証保護hook（未ログイン→/loginへリダイレクト）
    └── testAccounts.ts        # 開発用テストアカウント定義（幹事2名・参加者10名）
```

## 認証フロー
### 設計思想
ユーザーにログインを意識させない。フォーム送信のタイミングで初めて認証を求める。

### 認証が発生するタイミング
- **イベント作成**（EventForm）：送信ボタン押下時、未ログインなら「メアド入力 → 8桁OTP入力」をフォーム内にインライン表示
- **参加申込**（JoinForm）：送信ボタン押下時、未ログインならフォームのメアドにOTPを自動送信し、インラインでコード入力を表示
- **ダッシュボード直アクセス**（/dashboard）：`useRequireAuth` により /login にリダイレクト
- **チャット直アクセス**（/chat/[id]）：`useRequireAuth` により /login にリダイレクト

### 初回ログインメッセージ
OTPステップでは「この確認は、このアプリを初めて使う今回だけです。次回からは自動でログインされます。」と表示。

### 開発環境
`NEXT_PUBLIC_ENV=development` のときはテストアカウントを使用し、OTP認証をバイパス。

### 保護対象ページ
- 認証保護（useRequireAuth）：`/dashboard`・`/chat/[id]`
- 認証不要（インラインOTP）：`/create`・`/join/[id]`
- 完全公開：`/`・`/event/[id]`・`/login`

## 環境変数
```
NEXT_PUBLIC_SUPABASE_URL        # Supabase プロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key
NEXT_PUBLIC_ENV                 # "development" のみテストアカウント有効
RESEND_API_KEY                  # メール送信（未設定時はモック動作）
```

## Supabase設定
- Authentication → URL Configuration → Site URL：本番URL（https://evently-lac-chi.vercel.app/）
- Authentication → Email Templates → Magic Link：`{{ .Token }}` で8桁コードを表示するテンプレートに変更済み
- OTPは8桁（Supabaseデフォルト）

## Supabaseテーブル構成
```
communities       # コミュニティ（id, name, slug, admin_email, is_private）
members           # メンバー（id, community_id, auth_user_id, name, email, ...）
events            # イベント（id, community_id, title, date_start, date_end, place_public, place_private, capacity, status）
event_members     # イベント参加（event_id, member_id, role: organizer|participant）
chat_messages     # チャット（event_id, member_id, body, sent_at）
chat_reads        # 既読管理（message_id, member_id）
announcements     # お知らせ（event_id, member_id, title, body, is_pinned）
reminders         # リマインダー設定（event_id, remind_at）
```

## ダッシュボード（/dashboard）の表示ロジック
- 幹事のイベント：フルカード（参加者一覧・LINE文面コピー・お知らせ送信・削除）
- 参加者のイベント：シンプルカード（基本情報・イベント詳細リンク・チャットボタン）
- `getOrganizerEvents(memberId)` / `getParticipantEvents(memberId)` で分けて取得

## デザイン仕様
- メインカラー：#06C755（LINEグリーン）
- サブカラー：#00A040
- 背景：#e8e8e8 / カード：#ffffff
- 角丸：rounded-2xl（カード）/ rounded-full（バッジ・ボタン）
- モバイルファースト、max-width: 480px、PC中央寄せ
- フォント：-apple-system, 'Hiragino Sans'

## デモデータ
`lib/supabase.ts` の `initDemoData()` で初回起動時に自動生成。
- コミュニティ：「MBA同窓会」（slug: `mba-alumni`）
- イベント：「MBA同窓生 春の交流会2026」
- メンバー：12名（幹事2名・参加者10名）、`testAccounts.ts` 定義
- チャット：3件

## 開発環境の注意事項
- テストアカウント切替はTestLoginBarで行う（`NEXT_PUBLIC_ENV=development` 時のみ表示）
- 本番環境ではTestLoginBarは非表示・テストアカウントは一切使わない
- デプロイはVercel、ブランチ `master`

## Supabase RLSポリシー設定（重要）
テーブル作成後に必ずRLSポリシーを設定すること。未設定だと全アクセスが拒否される（406/403エラー）。

```sql
-- communities
CREATE POLICY "communities_select" ON communities FOR SELECT USING (true);
CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- members
CREATE POLICY "members_select" ON members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "members_update" ON members FOR UPDATE USING (auth.role() = 'authenticated');

-- events
CREATE POLICY "events_select" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- event_members
CREATE POLICY "event_members_select" ON event_members FOR SELECT USING (true);
CREATE POLICY "event_members_insert" ON event_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**トラブルシューティング実績（2026-04-03）**
- 症状：OTP認証成功後にイベント作成が失敗、コンソールに406/403
- 原因：RLSポリシー未設定
- 確認方法：Supabase Auth Logs → `/verify` が200なのに `/rest/v1/テーブル名` が406ならRLSが原因

## 未実装機能（今後のスコープ）
- Web Push通知
- リマインダーの実際の送信処理（cron等）
- 複数コミュニティ対応
