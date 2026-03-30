# Evently - CLAUDE.md

## プロジェクト概要
コミュニティのイベント幹事の作業負担をほぼゼロにするイベント管理WebアプリのプロトタイプTypeScript。
想定ユーザー：ビジネススクール同窓会・社会人コミュニティ・業界勉強会などのセミフォーマルなコミュニティ。

## 技術スタック
- フロントエンド：Next.js 14 (App Router) + TailwindCSS + TypeScript
- データ保存：localStorageのみ（バックエンド・DB不要）
- デプロイ：Vercel（GitHub連携、ブランチ：master）

## ディレクトリ構成
```
evently_app/
├── app/
│   ├── page.tsx              # 幹事：イベント作成画面
│   ├── dashboard/page.tsx    # 幹事：イベント管理画面
│   ├── event/[id]/page.tsx   # 参加者：イベントページ
│   ├── join/[id]/page.tsx    # 参加者：参加申込画面
│   ├── join-done/page.tsx    # 参加者：参加確定画面
│   ├── chat/[id]/page.tsx    # 参加者：チャット画面
│   └── layout.tsx            # 共通レイアウト（Headerを含む）
├── components/
│   ├── Header.tsx            # 全ページ共通ヘッダー（幹事/参加者モード切替）
│   ├── EventForm.tsx         # イベント作成フォーム
│   ├── JoinForm.tsx          # 参加申込フォーム（プロフィール保存機能あり）
│   ├── ChatBox.tsx           # チャットUI
│   ├── ParticipantList.tsx   # 参加者一覧
│   ├── StatusBar.tsx         # 残席数バー
│   └── MailPreview.tsx       # メール通知モックUI
└── lib/
    └── storage.ts            # localStorage操作ユーティリティ
```

## localStorageキー設計
```
evently_event_${eventId}          # イベント1件
evently_participants_${eventId}   # 参加者リスト（JSON配列）
evently_chat_${eventId}           # チャットメッセージ（JSON配列）
evently_events_index              # 全イベントIDリスト（JSON配列）
evently_saved_profile             # 参加者プロフィール保存（任意）
```

## デザイン仕様
- メインカラー：#06C755（LINEグリーン）
- サブカラー：#00A040
- 背景：#f5f5f5 / カード：#ffffff
- 角丸：rounded-2xl（カード）/ rounded-full（バッジ・ボタン）
- モバイルファースト、max-width: 480px、PC中央寄せ
- フォント：-apple-system, 'Hiragino Sans'

## 画面モード切替
- 幹事モード：`/`・`/dashboard`（Header右上に「参加者画面へ」ボタン）
- 参加者モード：`/event/[id]`など（Header右上に「幹事画面へ」ボタン）

## デモデータ
`lib/storage.ts` の `initDemoData()` で初回起動時に自動生成。
- イベント：「CBS 若手卒業生交流会2026」（id: `mba2026spring`）
- 参加者：10名（年度表記は `Class of XXXX` 形式に統一）
- チャット：3件

## 注意事項
- localStorageはブラウザをまたいでデータ共有不可（デモ・プロトタイプ用途）
- メール通知・チャット通知はモックUI表示のみ（実際には送信しない）
- デモデータは `evently_events_index` が存在しない場合のみ生成される
- デプロイはVercel、ブランチ `master`、自動デプロイが効かない場合は「Create Deployment」から手動実行

## 実装していない機能（スコープ外）
- メール実際の送信（SendGrid等）
- リアルタイムチャット（WebSocket/DB必要）
- 認証・ログイン
- 複数端末間のデータ同期
