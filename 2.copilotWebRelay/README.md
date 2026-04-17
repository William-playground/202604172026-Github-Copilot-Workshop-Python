# Copilot Web Relay

GitHub Copilot SDK を利用したブラウザ向け AI チャット Web アプリです。

## 構成

- `server/` — Node.js + Express + `ws` (WebSocket) サーバー。`@github/copilot-sdk` の `CopilotClient` でセッション管理。
- `client/` — React + TypeScript + Vite のチャット UI。Markdown レンダリング対応。

## WebSocket プロトコル

クライアント → サーバー:

```json
{ "type": "message", "content": "こんにちは" }
```

サーバー → クライアント:

```json
{ "type": "delta", "content": "部分的な応答" }
{ "type": "done" }
{ "type": "error", "message": "エラー内容" }
```

## セットアップ

```bash
cd 2.copilotWebRelay
npm install
npm run install:all
npm run dev
```

- バックエンド: <http://localhost:3001> (WebSocket: `ws://localhost:3001/ws`)
- フロントエンド: <http://localhost:5173>

## 必要な環境

- Node.js 18 以上
- GitHub Copilot のサブスクリプション（SDK 認証に必要）
