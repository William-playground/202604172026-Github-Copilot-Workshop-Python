# データモデル仕様

> **実装状況**: 現時点でバックエンドのデータモデルは未実装。初期版ではすべてのデータを localStorage に保存する設計。

## フロントエンド状態オブジェクト（計画中）

タイマーの状態はフロントエンド JavaScript 内の単一オブジェクトで管理する。

```js
{
  mode: 'work',               // 現在モード: 'work' | 'short_break' | 'long_break'
  durationSeconds: 1500,      // セッションの総秒数
  remainingSeconds: 1500,     // 現在の残り秒数
  isRunning: false,           // 実行中かどうか
  endTime: null,              // 実行中セッションの終了予定時刻（Unix ms）
  completedPomodoros: 0,      // 当日の完了回数
  focusSecondsToday: 0,       // 当日の累計集中秒数
  cycleCount: 0,              // 作業完了回数ベースのサイクル管理
  todayKey: '2026-04-17'      // 日付単位の保存キー（YYYY-MM-DD）
}
```

## localStorage 保存項目（計画中）

| キー | 型 | 説明 |
|---|---|---|
| `todayKey` | string | 当日の日付（YYYY-MM-DD） |
| `completedPomodoros` | number | 当日の完了ポモドーロ数 |
| `focusSecondsToday` | number | 当日の累計集中秒数 |
| `isRunning` | boolean | タイマーが実行中かどうか |
| `endTime` | number \| null | タイマーの終了予定時刻（Unix ms） |
| `mode` | string | 現在のモード |
| `cycleCount` | number | サイクル回数 |

## 将来の SQLite データモデル（フェーズ7以降）

バックエンドへの移行時に以下のテーブルを追加予定。現時点では未実装。

### settings テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER | プライマリキー |
| work_duration | INTEGER | 作業時間（秒） |
| short_break_duration | INTEGER | 短休憩時間（秒） |
| long_break_duration | INTEGER | 長休憩時間（秒） |

### daily_stats テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER | プライマリキー |
| date | TEXT | 日付（YYYY-MM-DD） |
| completed_pomodoros | INTEGER | 完了ポモドーロ数 |
| focus_seconds | INTEGER | 累計集中秒数 |

### session_history テーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | INTEGER | プライマリキー |
| started_at | TEXT | セッション開始時刻（ISO 8601） |
| ended_at | TEXT | セッション終了時刻（ISO 8601） |
| mode | TEXT | モード（work / short_break / long_break） |
| completed | INTEGER | 正常完了したか（0/1） |

## 参考ドキュメント

- `architecture.md`（リポジトリルート）セクション 6: 状態モデル
- `architecture.md`（リポジトリルート）セクション 8: データ保存方針
