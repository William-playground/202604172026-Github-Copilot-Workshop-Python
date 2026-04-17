# Copilot Instructions

## 重要：言語設定

**必ず日本語でレビューを行ってください。すべてのコメント、提案、説明は日本語で記述してください。**

## プロジェクト概要

GitHub Copilot ワークショップ用リポジトリ。Python (Flask) ベースの Web アプリケーションを段階的に構築する。

## ファイル配置ルール

- **ポモドーロタイマー**に関するコードは `1.pomodoro/` 配下に配置する
- 将来の演習（例: Copilot Web Relay）は `2.copilotWebRelay/` 配下に配置する
- 各演習のアーキテクチャ設計は `architecture.md`（ルート）を参照する

## アーキテクチャ（ポモドーロタイマー）

- **バックエンド**: Flask（薄いサーバー。ページ配信と静的ファイル配信が主務）
- **フロントエンド**: HTML/CSS/JavaScript の単一ページ構成
- **タイマー制御**: ブラウザ側 JavaScript が担当。終了予定時刻と現在時刻の差分で残り時間を算出する（毎秒減算ではない）
- **データ保存**: 初期版は localStorage。将来 Flask API + SQLite に移行予定
- **フロントエンド内部モジュール**: TimerEngine / SessionFlow / StatsStore / UIRenderer の4責務に分離

```
1.pomodoro/
  app.py              # Flask アプリケーション本体
  templates/
    index.html        # 画面テンプレート
  static/
    css/style.css     # UI スタイル
    js/app.js         # タイマー制御と DOM 更新
```

## 開発環境

- Python 3.11（Dev Container）
- Node.js（Dev Container feature として導入済み）
- Flask でローカルサーバーを起動: `cd 1.pomodoro && flask run` または `python app.py`

## コーディング規約

- 見た目変更とロジック変更を同一コミットで混在させない
- フェーズごとに動作確認できる状態を維持する（段階的実装）
- 円形プログレスは SVG または conic-gradient で実装する
- 時刻表示は mm:ss 形式固定
