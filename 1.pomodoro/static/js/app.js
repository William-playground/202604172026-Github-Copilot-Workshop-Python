/* ==========================================================================
 * Pomodoro Timer フロントエンドロジック
 *
 * 本ファイルは「視覚的フィードバック強化」Issue に沿って、
 *  - 滑らかな円形プログレスのアニメーション更新
 *  - 進捗に応じた色グラデーション変化（青 -> 黄 -> 赤）
 *  - 作業モード中の背景パーティクル/波紋エフェクト制御
 * を実装する。
 *
 * タイマー残り時間は、終了予定時刻と現在時刻の差分で算出する方針
 * （毎秒減算しない）。タブ非アクティブ時の時間ずれを抑える。
 * ========================================================================= */

(() => {
  "use strict";

  // ---- 定数 -------------------------------------------------------------
  const MODES = {
    work: { label: "作業中", duration: 25 * 60, isFocus: true },
    shortBreak: { label: "短休憩", duration: 5 * 60, isFocus: false },
    longBreak: { label: "長休憩", duration: 15 * 60, isFocus: false },
  };
  const LONG_BREAK_EVERY = 4; // 4 回の作業ごとに長休憩
  const CIRCUMFERENCE = 2 * Math.PI * 108; // SVG 円周（stroke-dasharray と同値）

  // ---- DOM -------------------------------------------------------------
  const $time = document.getElementById("time-display");
  const $mode = document.getElementById("mode-label");
  const $bar = document.getElementById("progress-bar");
  const $startPause = document.getElementById("start-pause");
  const $reset = document.getElementById("reset");
  const $statCompleted = document.getElementById("stat-completed");
  const $statFocus = document.getElementById("stat-focus");
  const $canvas = document.getElementById("particle-canvas");

  // ---- 状態 -------------------------------------------------------------
  const state = {
    mode: "work",
    durationSeconds: MODES.work.duration,
    remainingSeconds: MODES.work.duration,
    isRunning: false,
    endTime: null, // 実行中セッションの終了予定時刻 (ms)
    cycleCount: 0, // 作業完了回数（長休憩判定用）
    completedPomodoros: 0,
    focusSecondsToday: 0,
  };

  let tickHandle = null;

  // ======================================================================
  // 1. 色グラデーション（青 -> 黄 -> 赤）
  //    progress: 0.0（開始直後）〜 1.0（終了直前）
  // ======================================================================
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    return [0, 1, 2].map((i) => Math.round(lerp(c1[i], c2[i], t)));
  }

  /**
   * 進捗率 p（0〜1）を、集中用カラースケール（青→黄→赤）に写像する。
   * 休憩モードでは落ち着いた緑系に固定して視覚的に区別する。
   */
  function progressToColor(p, isFocus) {
    if (!isFocus) {
      return "rgb(90, 200, 160)"; // 休憩: 緑
    }
    const BLUE = [74, 168, 255];
    const YELLOW = [247, 200, 70];
    const RED = [240, 88, 88];
    const clamped = Math.max(0, Math.min(1, p));
    const rgb =
      clamped < 0.5
        ? lerpColor(BLUE, YELLOW, clamped / 0.5)
        : lerpColor(YELLOW, RED, (clamped - 0.5) / 0.5);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  // ======================================================================
  // 2. レンダリング
  // ======================================================================
  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function render() {
    const { mode, durationSeconds, remainingSeconds } = state;
    const modeDef = MODES[mode];
    const progress = 1 - remainingSeconds / durationSeconds; // 0 -> 1

    $time.textContent = formatTime(remainingSeconds);
    $mode.textContent = modeDef.label;

    // 円形プログレス: 残り時間を dashoffset に反映（CSS transition で滑らかに補間）
    const offset = CIRCUMFERENCE * (1 - remainingSeconds / durationSeconds);
    $bar.style.strokeDashoffset = String(offset);

    // カラーグラデーション更新（作業モードのみ青→黄→赤、休憩は固定色）
    const color = progressToColor(progress, modeDef.isFocus);
    document.documentElement.style.setProperty("--progress-color", color);

    // 背景エフェクトの ON/OFF（作業モードかつ実行中のみ有効）
    document.body.classList.toggle(
      "focus-active",
      modeDef.isFocus && state.isRunning
    );

    // ボタン表示
    $startPause.textContent = state.isRunning ? "一時停止" : "開始";

    // 統計
    $statCompleted.textContent = String(state.completedPomodoros);
    $statFocus.textContent = `${Math.floor(state.focusSecondsToday / 60)}分`;
  }

  // ======================================================================
  // 3. タイマー制御（終了予定時刻との差分で残り時間を算出）
  // ======================================================================
  function tick() {
    if (!state.isRunning) return;
    const remaining = (state.endTime - Date.now()) / 1000;
    if (remaining <= 0) {
      state.remainingSeconds = 0;
      render();
      onSessionComplete();
      return;
    }
    state.remainingSeconds = remaining;
    render();
  }

  function start() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.endTime = Date.now() + state.remainingSeconds * 1000;
    tickHandle = setInterval(tick, 250);
    particles.start();
    render();
  }

  function pause() {
    if (!state.isRunning) return;
    // 残り時間を endTime から再計算しておく
    state.remainingSeconds = Math.max(0, (state.endTime - Date.now()) / 1000);
    state.isRunning = false;
    state.endTime = null;
    clearInterval(tickHandle);
    tickHandle = null;
    particles.stop();
    render();
  }

  function toggleStartPause() {
    state.isRunning ? pause() : start();
  }

  function reset() {
    clearInterval(tickHandle);
    tickHandle = null;
    state.isRunning = false;
    state.endTime = null;
    state.remainingSeconds = state.durationSeconds;
    particles.stop();
    render();
  }

  function setMode(nextMode) {
    state.mode = nextMode;
    state.durationSeconds = MODES[nextMode].duration;
    state.remainingSeconds = state.durationSeconds;
    state.endTime = null;
  }

  function onSessionComplete() {
    clearInterval(tickHandle);
    tickHandle = null;
    state.isRunning = false;
    state.endTime = null;

    if (state.mode === "work") {
      state.completedPomodoros += 1;
      state.focusSecondsToday += MODES.work.duration;
      state.cycleCount += 1;
      const nextMode =
        state.cycleCount % LONG_BREAK_EVERY === 0 ? "longBreak" : "shortBreak";
      setMode(nextMode);
    } else {
      setMode("work");
    }
    particles.stop();
    render();
  }

  // ======================================================================
  // 4. 背景パーティクル（作業モード実行中のみ稼働）
  //    軽量実装: 数十個の粒を上方向にゆっくり浮遊させる
  // ======================================================================
  const particles = (() => {
    const ctx = $canvas.getContext("2d");
    let raf = null;
    let dots = [];
    let width = 0;
    let height = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = $canvas.clientWidth;
      height = $canvas.clientHeight;
      $canvas.width = width * dpr;
      $canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      const count = Math.max(20, Math.floor((width * height) / 28000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2.2,
        vy: -(0.1 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.15,
        alpha: 0.2 + Math.random() * 0.5,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--progress-color")
        .trim() || "rgb(74, 168, 255)";
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y < -4) {
          d.y = height + 4;
          d.x = Math.random() * width;
        }
        if (d.x < -4) d.x = width + 4;
        if (d.x > width + 4) d.x = -4;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = d.alpha;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() {
      // 作業モードかつ実行中のみ稼働
      if (!MODES[state.mode].isFocus) return;
      if (raf) return;
      resize();
      seed();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      ctx.clearRect(0, 0, width, height);
    }

    window.addEventListener("resize", () => {
      if (!raf) return;
      resize();
      seed();
    });

    return { start, stop };
  })();

  // ======================================================================
  // 5. 初期化
  // ======================================================================
  $startPause.addEventListener("click", toggleStartPause);
  $reset.addEventListener("click", reset);

  // SVG dasharray は CSS 側で指定済み。初期 offset=0（満タン）で描画開始。
  $bar.style.strokeDashoffset = "0";
  render();
})();
