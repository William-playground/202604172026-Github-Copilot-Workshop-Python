# ポモドーロタイマー Web アプリケーションアーキテクチャ案

## 1. 目的

本アプリは、ポモドーロ・テクニックに基づく集中時間管理を行う単一ページの Web アプリケーションとして実装する。

初期リリースでは、以下を重視する。

- モックに沿ったシンプルで見やすい UI
- ブラウザ上で安定して動くタイマー制御
- 実装の分かりやすさと拡張しやすさ
- 将来的な API 化、永続化、分析機能追加への対応

## 2. 基本方針

初期構成は Flask と HTML/CSS/JavaScript を用いたシンプルな構成とする。

- Flask は画面配信と将来拡張用の API 土台を担当する
- タイマーの進行管理はブラウザ側 JavaScript が担当する
- UI 描画は HTML/CSS と JavaScript で行う
- 日次進捗などの軽量な保存は localStorage を利用する

この方針を採用する理由は、タイマーアプリの中心機能が秒単位の表示更新であり、毎秒サーバー通信を行うよりもブラウザ内で状態を保持して描画する方が精度、応答性、実装コストの面で有利だからである。

## 3. 全体アーキテクチャ

```text
Browser
  ├─ HTML Template
  ├─ CSS
  └─ JavaScript
       ├─ TimerEngine
       ├─ SessionFlow
       ├─ StatsStore
       └─ UIRenderer

Flask
  ├─ Route: /
  ├─ Static file serving
  └─ Future APIs
       ├─ /api/settings
       ├─ /api/stats
       └─ /api/history
```

## 4. レイヤーごとの責務

### 4.1 Flask サーバー

初期版では薄いサーバーとして設計する。

責務:

- トップページの配信
- テンプレートのレンダリング
- CSS、JavaScript、画像など静的ファイルの配信
- 将来の API 拡張ポイントを確保

初期版で想定するルート:

- GET /

将来追加可能な API:

- GET /api/settings
- POST /api/settings
- GET /api/stats/today
- POST /api/stats/today
- GET /api/history

### 4.2 フロントエンド

フロントエンドは単一ページとして構成し、状態管理と描画を明確に分離する。

責務:

- タイマーの開始、一時停止、リセット
- 作業中、短休憩、長休憩のモード遷移
- 円形プログレスバーの更新
- 残り時間の表示更新
- 今日の完了回数、集中時間の表示
- localStorage への状態保存

## 5. フロントエンド内部設計

### 5.1 TimerEngine

役割:

- 現在のセッションの残り時間を計算する
- 開始、一時停止、リセットを制御する
- 終了時刻ベースで残り時間を算出する

重要な設計ポイント:

- 毎秒単純に 1 秒ずつ減算するのではなく、終了予定時刻と現在時刻の差分で残り時間を求める
- タブ非アクティブ時や描画遅延が発生しても時間ずれを抑える

### 5.2 SessionFlow

役割:

- 作業セッションと休憩セッションの遷移管理
- 短休憩、長休憩の切り替えルール管理
- 何セット目のポモドーロかを保持する

基本ルール例:

- 作業 25 分
- 短休憩 5 分
- 4 回完了ごとに長休憩 15 分から 30 分

### 5.3 StatsStore

役割:

- 今日の完了ポモドーロ数を保存する
- 今日の累計集中時間を保存する
- 日付切り替わり時に当日用データへ更新する

初期版保存先:

- localStorage

将来拡張:

- Flask API 経由で SQLite に保存
- 履歴分析画面への連携

### 5.4 UIRenderer

役割:

- モード表示の更新
- 残り時間テキストの更新
- 円形プログレスバーの描画更新
- ボタン状態の切り替え
- 統計カードの表示更新

## 6. 状態モデル

フロントエンドでは、タイマー状態を単一オブジェクトで管理する。

```js
{
  mode: 'work',
  durationSeconds: 1500,
  remainingSeconds: 1500,
  isRunning: false,
  endTime: null,
  completedPomodoros: 0,
  focusSecondsToday: 0,
  cycleCount: 0,
  todayKey: '2026-04-17'
}
```

主な項目:

- mode: 現在モード
- durationSeconds: そのセッションの総秒数
- remainingSeconds: 現在の残り秒数
- isRunning: 実行中かどうか
- endTime: 実行中セッションの終了予定時刻
- completedPomodoros: 当日の完了回数
- focusSecondsToday: 当日の累計集中秒数
- cycleCount: 作業完了回数ベースのサイクル管理
- todayKey: 日付単位の保存キー

## 7. ディレクトリ構成案

初期版では以下の構成を推奨する。

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

責務:

- app.py: Flask アプリケーション本体
- templates/index.html: 画面テンプレート
- static/css/style.css: モックに沿った UI スタイル
- static/js/app.js: タイマー制御と DOM 更新

将来、規模が増えた場合は JavaScript を以下のように分割可能とする。

```text
static/js/
  timer-engine.js
  session-flow.js
  stats-store.js
  ui-renderer.js
  app.js
```

## 8. データ保存方針

### 初期版

- 設定値と当日統計は localStorage に保存する
- バックエンド DB は導入しない

保存対象例:

- 作業時間
- 短休憩時間
- 長休憩時間
- 当日の完了回数
- 当日の集中時間
- 実行中タイマーの復元用情報

### 将来版

必要に応じて SQLite を追加し、以下をサーバー側に保存する。

- 日次統計
- セッション履歴
- ユーザー設定

この段階で Flask API を追加し、クライアントから JSON で送受信する。

## 9. UI 実装方針

添付モックをもとに、1 画面完結の構成とする。

主要 UI 要素:

- アプリタイトル
- 現在モード表示
- 円形プログレスタイマー
- 開始ボタン
- 一時停止ボタンまたは開始とのトグル制御
- リセットボタン
- 今日の進捗カード

UI 上の注意点:

- 時刻表示は mm:ss 形式で固定する
- 円形プログレスは SVG または conic-gradient を使って実装する
- モード切り替え時に表示色を変える余地を残す
- モバイル幅でも崩れにくいレイアウトにする

## 10. 実装フェーズ案

### フェーズ 1: 最小動作版

- Flask でトップページを表示する
- HTML/CSS でモックに近い静的 UI を作る
- JavaScript で開始、停止、リセットを実装する
- 25 分タイマーを動かす

### フェーズ 2: ポモドーロフロー対応

- 作業、短休憩、長休憩のモード遷移を実装する
- 完了回数に応じた長休憩ルールを追加する
- 完了時に統計を更新する

### フェーズ 3: 永続化強化

- localStorage で状態復元を実装する
- ページ再読み込み後も当日進捗を維持する

### フェーズ 4: 将来拡張

- Flask API を追加する
- SQLite に履歴と設定を保存する
- 分析画面や履歴一覧を追加する

## 11. 推奨判断

本プロジェクトの初期段階では、以下の構成を正式案とする。

- Flask は薄いサーバーとして利用する
- タイマー制御はクライアント JavaScript に置く
- 初期保存は localStorage を使う
- API と DB は将来拡張として段階的に導入する

この構成により、ワークショップ用途でも実装しやすく、短時間で UI と動作を完成させつつ、将来的な拡張にも耐えられる設計となる。