# アーキテクチャ概要

> **実装状況**: フェーズ0（初期スタブ）。`app.py` にコメントのみが記述された最小構成。

## 現在の構成

```text
1.pomodoro/
  app.py         # Flask アプリケーション（スタブ）
  features.md    # 機能仕様
  plan.md        # 実装計画
  pomodoro.png   # モック画像
```

## 設計方針

- **バックエンド**: Flask（薄いサーバー。ページ配信と静的ファイル配信が主務）
- **フロントエンド**: HTML/CSS/JavaScript の単一ページ構成
- **タイマー制御**: ブラウザ側 JavaScript が担当。終了予定時刻と現在時刻の差分で残り時間を算出する
- **データ保存**: 初期版は localStorage。将来 Flask API + SQLite に移行予定

## 将来のディレクトリ構成（計画中）

```text
1.pomodoro/
  app.py
  templates/
    index.html
  static/
    css/
      style.css
    js/
      app.js
```

## フロントエンド内部モジュール（計画中）

| モジュール | 責務 |
|---|---|
| TimerEngine | 残り時間の計算・開始/一時停止/リセット制御 |
| SessionFlow | 作業・短休憩・長休憩のモード遷移管理 |
| StatsStore | 当日完了数・集中時間の保存（localStorage） |
| UIRenderer | 残り時間・プログレス・ボタン状態などの DOM 更新 |

## 参考ドキュメント

- `architecture.md`（リポジトリルート）: 詳細なアーキテクチャ設計
- `plan.md`: フェーズ別実装計画
- `features.md`: 機能一覧
