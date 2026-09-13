// ===========================
// CobbleWorks - 押し通知（Web Push）
// ===========================
// 解決している問題:
//   リクエストを出した人は、アプリが出来たあとサイトに戻ってこない。
//   Inbox（notifications.js）は来た人にしか届かないので、
//   閉じていても届く通知が要る。
//
// 仕組み:
//   ブラウザに購読（subscription）を作らせ、それをSupabaseに預ける。
//   あとはサーバー（Edge Function「notification-push」）が
//   notifications テーブルの未配信行を見て送る。ここは「登録係」に徹する。
//
// 注意:
//   通知の許可を求めるのは、必ずユーザーが押した直後だけにする。
//   ページを開いた瞬間に聞くと、ほぼ確実に拒否される。
//   ブラウザは一度拒否されると二度と聞けない（設定画面から戻すしかない）。

// Forgetful Tracker / Family Schedule と同じ鍵。Supabase側の秘密鍵と対になっている
const PUSH_VAPID_PUBLIC_KEY =
  'BCTRqMI1R172Kv_jJBw0df5f4jxRjPuKgXFXJ6yH7VeFNTyY5m-7U6TR3tnaag3iidYPWR0sA3W2sdk-SKWw0VE';

// ブラウザに渡す鍵はバイト列でなければならないので、文字列から変換する
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

// ===========================
// この端末で通知が使えるか
// ===========================

function isIosDevice() {
  // iPadOSはUAがMacと同じになるため、タッチ可否も見る
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ホーム画面に追加したアイコンから開いているか
function isStandalone() {
  return window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
}

// この端末の状態を1語で返す。UIはこれを見て出し分ける
//   'unsupported'      … 通知に対応していないブラウザ
//   'ios-needs-install'… iPhone/iPad で、まだホーム画面に追加していない
//   'denied'           … 前に拒否された（設定画面からしか戻せない）
//   'granted'          … 許可済み
//   'default'          … まだ聞いていない
function pushState() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // iOSは「ホーム画面に追加」するまでPushManager自体が存在しない。
    // 対応していないブラウザと区別しないと、案内しようがない
    if (isIosDevice() && !isStandalone()) return 'ios-needs-install';
    return 'unsupported';
  }
  if (isIosDevice() && !isStandalone()) return 'ios-needs-install';
  return Notification.permission;
}

// この端末が今この瞬間に通知を受け取れる状態か。
//
// ブラウザ側の購読だけを見てはいけない。購読を作ったあとサーバーへの保存に失敗すると、
// 「ブラウザは購読済み・サーバーは宛先を知らない」というズレが残る。
// この状態を「オン」と表示すると、鳴らない理由が誰にも分からなくなる。
// なので両方そろって初めてオンとみなし、ズレていたらその場で直す。
async function isPushEnabledHere() {
  if (pushState() !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const json = subscription.toJSON();

    // 自分の行しか見えない（RLS）ので、他人の端末の宛先は数に入らない
    const { count, error } = await supabaseClient
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('endpoint', json.endpoint);

    if (error) {
      console.error('Failed to check push subscription:', error.message);
      return false;
    }
    if (count > 0) return true;

    // サーバーに届いていない。許可はもう出ているので、
    // ユーザーにボタンを押し直させず、ここで登録し直す
    const { error: saveError } = await supabaseClient.rpc('save_push_subscription', {
      p_endpoint: json.endpoint,
      p_subscription: json,
    });
    if (saveError) {
      console.error('Failed to re-save push subscription:', saveError.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to check push state:', e);
    return false;
  }
}

// ===========================
// オン / オフ
// ===========================

// 通知をオンにする。必ずボタンの中から呼ぶこと（許可ダイアログの条件）
// 戻り値の reason は、UI側が何を表示すべきか決めるために使う
async function enablePush() {
  const state = pushState();
  if (state === 'unsupported' || state === 'ios-needs-install' || state === 'denied') {
    return { ok: false, reason: state };
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return { ok: false, reason: 'signed-out' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: permission };

    const registration = await navigator.serviceWorker.ready;

    // 既に購読があればそれを使い回す。作り直すと宛先が変わってしまう
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        // falseにすると「黙って動く通知」になり、ブラウザに拒否される
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    // 直接insertではなく関数を通す。同じ端末を別アカウントで使い始めたとき、
    // 古い持ち主の行を外してから入れ直す必要があるため（0041参照）
    const { error } = await supabaseClient.rpc('save_push_subscription', {
      p_endpoint: json.endpoint,
      p_subscription: json,
    });
    if (error) {
      console.error('Failed to save push subscription:', error.message);
      return { ok: false, reason: 'save-failed' };
    }

    return { ok: true, reason: 'granted' };
  } catch (e) {
    console.error('Push subscription failed:', e);
    return { ok: false, reason: 'failed' };
  }
}

// 通知をオフにする。ブラウザ側の購読も消さないと、宛先だけ生き残る
async function disablePush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.toJSON().endpoint;
    await subscription.unsubscribe();
    // 行が残っていると、消したはずの端末に送り続けて失敗を積み上げる
    await supabaseClient.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return true;
  } catch (e) {
    console.error('Failed to disable push:', e);
    return false;
  }
}

// ===========================
// iPhone向けの案内
// ===========================

// iPhoneは「ホーム画面に追加」しないと通知が使えない（Appleの仕様で回避不可）。
// ここで押せないボタンを見せると、初めての人はそこで諦めてしまうので、
// ボタンの代わりに手順を出す
function buildIosInstallNote() {
  const note = document.createElement('div');
  note.className = 'push-ios-note';

  const title = document.createElement('p');
  title.className = 'push-ios-title';
  title.textContent = t.pushIosTitle;
  note.appendChild(title);

  const steps = document.createElement('ol');
  steps.className = 'push-ios-steps';
  [t.pushIosStep1, t.pushIosStep2, t.pushIosStep3].forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    steps.appendChild(li);
  });
  note.appendChild(steps);

  return note;
}

// 一度拒否されると、ブラウザはもう許可を聞いてくれない。
// ここで黙って隠すと「オンにできないが理由も分からない」行き止まりになるので、
// 自分で戻す手順を出す
function buildDeniedNote() {
  const note = document.createElement('div');
  note.className = 'push-ios-note';

  const title = document.createElement('p');
  title.className = 'push-ios-title';
  title.textContent = t.pushStatusDenied;
  note.appendChild(title);

  const steps = document.createElement('ol');
  steps.className = 'push-ios-steps';
  [t.pushDeniedStep1, t.pushDeniedStep2].forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    steps.appendChild(li);
  });
  note.appendChild(steps);

  return note;
}

// ===========================
// リクエスト送信直後のお誘い
// ===========================
// 「出した」と「できたら知らせる？」が一番つながる瞬間なので、ここで聞く。
// 断られても、あとからInboxとプロフィールでオンにできる

function hidePushPrompt() {
  const modal = document.getElementById('pushPromptModal');
  if (modal) modal.hidden = true;
}

async function maybeShowPushPrompt() {
  const modal = document.getElementById('pushPromptModal');
  if (!modal) return;

  const state = pushState();
  // 対応していない端末や、一度断られた端末に見せても操作できることが無い
  if (state === 'unsupported' || state === 'denied') return;
  // すでにオンの人に毎回見せたら、ただの邪魔になる
  if (await isPushEnabledHere()) return;

  const body = document.getElementById('pushPromptBody');
  const actions = document.getElementById('pushPromptActions');
  if (!body || !actions) return;

  body.textContent = '';
  actions.hidden = false;

  if (state === 'ios-needs-install') {
    // iPhoneは今すぐオンにできないので、ボタンではなく手順を見せる
    body.appendChild(buildIosInstallNote());
    actions.hidden = true;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'map-btn map-btn--secondary';
    close.textContent = t.pushGotIt;
    close.addEventListener('click', hidePushPrompt);
    body.appendChild(close);
  }

  modal.hidden = false;
}

// ===========================
// 画面の組み立て
// ===========================

// Inboxページの案内バーと、プロフィールの設定を同じ関数で更新する。
// 「今どうなっているか」の表示が2箇所でズレないように、状態は毎回取り直す
async function refreshPushUI() {
  const state = pushState();
  const enabled = await isPushEnabledHere();

  // --- Inboxページの案内バー ---
  const banner = document.getElementById('pushBanner');
  if (banner) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    // オン済み・未ログイン・対応外の端末には出さない（出しても押せないため）。
    // 拒否済みの人には出す。ボタンの代わりに戻し方を見せる
    const show = !enabled && !!session && state !== 'unsupported';
    banner.hidden = !show;

    const bannerBody = document.getElementById('pushBannerBody');
    if (bannerBody && show) {
      bannerBody.textContent = '';
      if (state === 'ios-needs-install') {
        bannerBody.appendChild(buildIosInstallNote());
      } else if (state === 'denied') {
        bannerBody.appendChild(buildDeniedNote());
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-btn map-btn--primary';
        btn.textContent = t.pushEnableBtn;
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          const result = await enablePush();
          btn.disabled = false;
          reportPushResult(result);
          await refreshPushUI();
        });
        bannerBody.appendChild(btn);
      }
    }
  }

  // --- プロフィールの設定モーダル ---
  const toggle = document.getElementById('pushNotifyInput');
  const status = document.getElementById('pushNotifyStatus');
  if (toggle) {
    toggle.checked = enabled;
    // 許可ダイアログはボタンを押した瞬間しか出せないので、
    // このチェックだけは「保存」を待たずその場で効かせる
    toggle.disabled = state === 'unsupported' || state === 'denied' || state === 'ios-needs-install';
  }
  if (status) {
    if (state === 'ios-needs-install') status.textContent = t.pushStatusIos;
    else if (state === 'denied') status.textContent = t.pushStatusDenied;
    else if (state === 'unsupported') status.textContent = t.pushStatusUnsupported;
    else status.textContent = enabled ? t.pushStatusOn : t.pushStatusOff;
  }
}

// 失敗した理由ごとに、次にどうすればいいかが分かる言葉を出す
function reportPushResult(result) {
  if (typeof showToast !== 'function') return;
  if (result.ok) {
    showToast(t.pushToastEnabled);
    return;
  }
  if (result.reason === 'denied') showToast(t.pushToastDenied);
  else if (result.reason === 'signed-out') showToast(t.pushToastSignedOut);
  else if (result.reason === 'default') showToast(t.pushToastDismissed);
  else showToast(t.pushToastFailed);
}

// ===========================
// 起動
// ===========================

document.addEventListener('DOMContentLoaded', function () {
  const promptEnableBtn = document.getElementById('pushPromptEnableBtn');
  if (promptEnableBtn) promptEnableBtn.addEventListener('click', async function () {
    promptEnableBtn.disabled = true;
    const result = await enablePush();
    promptEnableBtn.disabled = false;
    reportPushResult(result);
    hidePushPrompt();
    await refreshPushUI();
  });

  const promptLaterBtn = document.getElementById('pushPromptLaterBtn');
  if (promptLaterBtn) promptLaterBtn.addEventListener('click', hidePushPrompt);

  const toggle = document.getElementById('pushNotifyInput');
  if (toggle) toggle.addEventListener('change', async function () {
    if (toggle.checked) {
      const result = await enablePush();
      reportPushResult(result);
    } else {
      await disablePush();
      if (typeof showToast === 'function') showToast(t.pushToastDisabled);
    }
    await refreshPushUI();
  });

  refreshPushUI();

  // ログイン・ログアウトで案内バーの出し分けが変わる
  supabaseClient.auth.onAuthStateChange(function () { refreshPushUI(); });
});
