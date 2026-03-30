# Evently

イベント管理・参加申込アプリ（フロントエンドのみ、localStorage使用）

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 機能

- **幹事向け**
  - イベント作成（`/`）
  - 参加者管理ダッシュボード（`/dashboard`）

- **参加者向け**
  - イベント詳細ページ（`/event/[id]`）
  - 参加申込（`/join/[id]`）
  - 参加確定確認（`/join-done`）
  - 参加者チャット（`/chat/[id]`）

## データ

すべてのデータはブラウザの localStorage に保存されます。サーバー不要。

初回アクセス時にデモデータが自動生成されます。
デモイベントID: `mba2026spring`

## 技術スタック

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- localStorage（データ永続化）
