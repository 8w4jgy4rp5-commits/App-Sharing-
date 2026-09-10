// ミニアプリ共通の効果音ヘルパー。
//
// 音源ファイルは使わない。Web Audio API で「やわらかいマリンバ風」の音を
// その場で合成する。そのため:
//   ・著作権の心配がない
//   ・読み込みが一切重くならない(このファイル数KBのみ)
//   ・ループのつなぎ目などの問題も存在しない
//
// ------------------------------------------------------------------
// 使い方
// ------------------------------------------------------------------
//   <script src="../../app-sfx.js"></script>
//
//   AppSfx.mountToggle();   // 画面右上に「音のON/OFF」ボタンを出す(1行だけ)
//
//   AppSfx.tap();       // ボタンを押した
//   AppSfx.success();   // 保存・登録できた
//   AppSfx.error();     // 入力ミス
//   AppSfx.complete();  // タスク完了・達成
//   AppSfx.toggle();    // ON/OFFの切り替え
//
// 3つの約束事:
//   ・デフォルトはOFF。ユーザーが自分でONにするまで音は鳴らない。
//   ・ON/OFFの設定は localStorage に端末ローカルで保存する(クラウド同期しない)。
//     音の好みは端末ごとに違うため。言語設定やAPIキーと同じ扱い。
//   ・音が鳴らせない環境(iPhoneのマナーモード等)でもエラーにはならず、
//     ただ静かなだけ。アプリ側で try/catch する必要はない。
//
// ------------------------------------------------------------------
// ブラウザの自動再生ブロックについて
// ------------------------------------------------------------------
// ブラウザは「ユーザーが一度も操作していないページ」の音を止める。
// このファイルは AudioContext を最初のクリック/タップまで作らず、
// 作った後も resume() を試みるので、アプリ側で意識することはない。
// ------------------------------------------------------------------

window.AppSfx = (function () {
  'use strict';

  // 全アプリ共通のキー。1つのアプリでONにしたら他のアプリでもONになる。
  const LS_KEY = 'cobbleworks:sfx:enabled';

  // 全体の音量。効果音は「気づく程度」で十分なので控えめにしてある。
  let masterVolume = 0.35;

  let ctx = null;        // AudioContext(最初の操作まで作らない)
  let enabled = readEnabled();
  let toggleBtn = null;

  // ----------------------------------------------------------------
  // 設定の読み書き
  // ----------------------------------------------------------------
  function readEnabled() {
    try {
      return localStorage.getItem(LS_KEY) === 'on';
    } catch (e) {
      return false; // プライベートモード等で読めないときはOFF扱い
    }
  }

  function writeEnabled(on) {
    try {
      localStorage.setItem(LS_KEY, on ? 'on' : 'off');
    } catch (e) {}
  }

  // ----------------------------------------------------------------
  // AudioContext
  // ----------------------------------------------------------------
  // 最初のクリック/タップで作る。それ以前に作るとブラウザに止められる。
  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        return null;
      }
    }
    // タブを離れて戻ると suspended になっていることがある
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) {}
    }
    return ctx;
  }

  // ページ内で最初にユーザーが触れた時点で用意しておく。
  // ここで作っておくと、実際に音を鳴らす瞬間の遅れが無くなる。
  function unlock() {
    if (enabled) ensureContext();
  }
  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true });

  // ----------------------------------------------------------------
  // 音の合成
  // ----------------------------------------------------------------
  // マリンバらしさは「基音のサイン波 + 4倍音がごく短く鳴る」で出る。
  // 木琴の音板は4倍音が強く出るように削ってあるため。
  // さらにローパスフィルタで高い成分を丸めて、耳に刺さらないようにしている。
  function note(freq, delay, duration, level) {
    const ac = ensureContext();
    if (!ac) return;

    const start = ac.currentTime + delay;

    // 出口。ここで全体の音量とエンベロープ(音の減衰)をまとめて掛ける。
    const out = ac.createGain();
    const peak = masterVolume * level;
    out.gain.setValueAtTime(0.0001, start);
    out.gain.exponentialRampToValueAtTime(peak, start + 0.006);      // 立ち上がりは速く
    out.gain.exponentialRampToValueAtTime(0.0001, start + duration); // ゆっくり減衰

    // 角を丸めるフィルタ
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(freq * 6, 6000), start);
    lp.Q.value = 0.7;

    lp.connect(out);
    out.connect(ac.destination);

    // 基音
    const fund = ac.createOscillator();
    fund.type = 'sine';
    fund.frequency.setValueAtTime(freq, start);
    fund.connect(lp);
    fund.start(start);
    fund.stop(start + duration + 0.05);

    // 4倍音。短く消えることで「木を叩いた」感じになる。
    const partialGain = ac.createGain();
    partialGain.gain.setValueAtTime(0.22 * masterVolume * level, start);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.3);
    partialGain.connect(lp);

    const partial = ac.createOscillator();
    partial.type = 'sine';
    partial.frequency.setValueAtTime(freq * 4, start);
    partial.connect(partialGain);
    partial.start(start);
    partial.stop(start + duration + 0.05);
  }

  // 複数の音を並べて鳴らす。[周波数, 鳴らし始めるまでの秒数, 長さ, 音量]
  function play(notes) {
    if (!enabled) return;
    try {
      for (const n of notes) note(n[0], n[1], n[2], n[3]);
    } catch (e) {
      // 音が出せない環境でもアプリを止めない
    }
  }

  // ----------------------------------------------------------------
  // 効果音の種類
  // ----------------------------------------------------------------
  // 音階はCメジャーで揃えてあるので、続けて鳴っても濁らない。
  const SOUNDS = {
    // 軽い操作。短く1音だけ。
    tap:      [[880.00,  0,    0.18, 0.55]],                 // A5

    // ON/OFF切り替え。tapより少し低くして区別する。
    toggle:   [[659.25,  0,    0.16, 0.50]],                 // E5

    // 保存・登録の成功。2音上がる。
    success:  [[783.99,  0,    0.22, 0.55],                  // G5
               [1046.50, 0.07, 0.30, 0.50]],                 // C6

    // 完了・達成。3音の分散和音でご褒美感を出す。
    complete: [[1046.50, 0,    0.28, 0.50],                  // C6
               [1318.51, 0.09, 0.30, 0.45],                  // E6
               [1567.98, 0.18, 0.55, 0.45]],                 // G6

    // 入力ミス。低めに2音下がる。きつくならないよう音量も控えめ。
    error:    [[392.00,  0,    0.20, 0.45],                  // G4
               [329.63,  0.09, 0.30, 0.40]]                  // E4
  };

  // ----------------------------------------------------------------
  // ON/OFFボタン
  // ----------------------------------------------------------------
  const ICON_ON =
    '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor"/>' +
    '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

  const ICON_OFF =
    '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor"/>' +
    '<path d="m16.5 9.5 5 5m0-5-5 5" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

  function injectStyle() {
    if (document.getElementById('cw-sfx-style')) return;
    const style = document.createElement('style');
    style.id = 'cw-sfx-style';
    style.textContent =
      '.cw-sfx-toggle{position:fixed;top:10px;right:10px;z-index:60;' +
      'width:38px;height:38px;display:flex;align-items:center;justify-content:center;' +
      'padding:0;border-radius:50%;cursor:pointer;' +
      'background:var(--map-card,#fff);border:1px solid var(--map-border,#EDE2D4);' +
      'color:var(--map-faint,#B5A794);' +
      'box-shadow:var(--map-shadow-card,0 2px 10px rgba(60,40,20,.06));' +
      'transition:color .15s,border-color .15s,transform .1s}' +
      '.cw-sfx-toggle:hover{border-color:var(--map-accent-line,#E8C9BB)}' +
      '.cw-sfx-toggle:active{transform:scale(.92)}' +
      '.cw-sfx-toggle:focus-visible{outline:none;' +
      'box-shadow:var(--map-focus-ring,0 0 0 3px rgba(217,112,76,.15))}' +
      '.cw-sfx-toggle[aria-pressed="true"]{color:var(--map-accent,#D9704C);' +
      'border-color:var(--map-accent-line,#E8C9BB)}' +
      '.cw-sfx-toggle svg{width:20px;height:20px;display:block}' +
      '@media print{.cw-sfx-toggle{display:none}}';
    document.head.appendChild(style);
  }

  function paintToggle() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', enabled ? 'Turn sound off' : 'Turn sound on');
    toggleBtn.setAttribute('title', enabled ? 'Sound on' : 'Sound off');
    toggleBtn.querySelector('svg').innerHTML = enabled ? ICON_ON : ICON_OFF;
  }

  // 画面右上にON/OFFボタンを置く。アプリ側のHTML/CSSは触らなくてよい。
  function mountToggle(container) {
    if (toggleBtn) return toggleBtn;
    injectStyle();

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'cw-sfx-toggle';
    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"></svg>';
    toggleBtn.addEventListener('click', function () {
      setEnabled(!enabled);
      // ONにした瞬間だけ音を鳴らす。「どんな音か」をその場で確認できる。
      if (enabled) sounds.toggle();
    });

    paintToggle();
    (container || document.body).appendChild(toggleBtn);
    return toggleBtn;
  }

  // ----------------------------------------------------------------
  // 公開API
  // ----------------------------------------------------------------
  function setEnabled(on) {
    enabled = !!on;
    writeEnabled(enabled);
    paintToggle();
    if (enabled) ensureContext();
  }

  function setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, Number(v) || 0));
  }

  const sounds = {};
  for (const name of Object.keys(SOUNDS)) {
    sounds[name] = function () { play(SOUNDS[name]); };
  }

  // 他のタブでON/OFFされたら、こちらのボタンの見た目も合わせる
  window.addEventListener('storage', function (e) {
    if (e.key !== LS_KEY) return;
    enabled = readEnabled();
    paintToggle();
  });

  return {
    tap: sounds.tap,
    toggle: sounds.toggle,
    success: sounds.success,
    error: sounds.error,
    complete: sounds.complete,
    isEnabled: function () { return enabled; },
    setEnabled: setEnabled,
    setVolume: setVolume,
    mountToggle: mountToggle
  };
})();
