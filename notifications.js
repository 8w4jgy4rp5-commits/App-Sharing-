// ===========================
// CobbleWorks - お知らせ（Inbox）
// ===========================
// 解決している問題:
//   自分が出したリクエストからミニアプリが作られても、本人に伝える手段が無く、
//   たまたま見に来たときにしか気づけなかった。
//
// 仕組み:
//   通知を作るのはDB側のトリガー（supabase/migrations/0038_notifications.sql）。
//   文章はDBに持たず、type と関連IDから「その時の言語で」ここが組み立てる。
//   メールやWeb Pushを足すときも、読む先は同じ notifications テーブルになる。

const INBOX_LIMIT = 50; // 一度に表示するお知らせの上限

let inboxUser = null; // ログイン中のユーザー（未ログインならnull）

// 前回ログインしていたなら、Supabaseの確認を待たずにタブを出しておく。
// 待つと、ページを切り替えるたびにタブが後から現れてナビ全体がガタつく。
// このファイルは </body> 直前で読まれるので、ここでナビに触れる（描画前に間に合う）。
// 目印が古くて実際は未ログインだった場合は、確認が済んだ時点で消える。
(function showInboxTabBeforeAuth() {
  if (typeof hasSignedInHint !== 'function' || !hasSignedInHint()) return;
  const tab = document.getElementById('navInboxTab');
  if (tab) tab.hidden = false;
})();

// ===========================
// ナビの「Inbox」タブと未読バッジ
// ===========================

function renderInboxTab(unreadCount) {
  const tab = document.getElementById('navInboxTab');
  if (!tab) return;

  // お知らせはアカウントに紐づくので、未ログイン中はタブごと隠す
  tab.hidden = !inboxUser;

  const badge = document.getElementById('navInboxBadge');
  if (!badge) return;

  if (inboxUser && unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.hidden = false;
    tab.classList.add('site-nav-inbox--unread');
  } else {
    badge.hidden = true;
    tab.classList.remove('site-nav-inbox--unread');
  }
}

async function refreshInboxBadge() {
  if (!inboxUser) {
    renderInboxTab(0);
    return;
  }

  // 全ページで毎回走るので、件数だけ数えて本文は受け取らない（head: true）
  const { count, error } = await supabaseClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', inboxUser.id)
    .is('read_at', null);

  if (error) {
    console.error('Failed to count notifications:', error.message);
    renderInboxTab(0);
    return;
  }
  renderInboxTab(count || 0);
}

// ===========================
// Inboxページの一覧
// ===========================

// お知らせの日付。言語設定に合わせた書き方にする
function formatInboxDate(iso) {
  const locale = document.documentElement.getAttribute('lang') || 'en';
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// お知らせ1件分のカードを組み立てる。
// 中身はユーザーが書いた文字なので、innerHTMLではなくtextContentで入れる
function buildInboxCard(row) {
  const app = row.mini_apps;
  const hasLink = !!(app && app.url);

  // アプリに飛べるものはリンクにして、カードごと押せるようにする
  const card = document.createElement(hasLink ? 'a' : 'div');
  card.className = 'inbox-card';
  if (hasLink) {
    card.href = app.url;
    card.classList.add('inbox-card--link');
  }
  if (!row.read_at) card.classList.add('inbox-card--unread');

  const mark = document.createElement('span');
  mark.className = 'inbox-card-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none">'
    + '<path d="M4 12.5 9.5 18 20 7" stroke="currentColor" stroke-width="2.5" '
    + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  card.appendChild(mark);

  const body = document.createElement('div');
  body.className = 'inbox-card-body';

  const headline = document.createElement('p');
  headline.className = 'inbox-card-headline';
  headline.textContent = t.inboxAppBuilt;
  if (!row.read_at) {
    const isNew = document.createElement('span');
    isNew.className = 'inbox-card-new';
    isNew.textContent = t.inboxNewBadge;
    headline.appendChild(isNew);
  }
  body.appendChild(headline);

  if (app && app.name) {
    const appName = document.createElement('p');
    appName.className = 'inbox-card-app';
    appName.textContent = app.name;
    body.appendChild(appName);
  }

  // 「どのリクエストへの返事なのか」が分からないと通知の意味が伝わらない
  if (row.requests && row.requests.problem) {
    const req = document.createElement('p');
    req.className = 'inbox-card-request';
    req.textContent = t.inboxForRequest + ': ' + row.requests.problem;
    body.appendChild(req);
  }

  const meta = document.createElement('p');
  meta.className = 'inbox-card-meta';
  const parts = [formatInboxDate(row.created_at)];
  if (row.actor && row.actor.handle) parts.push('@' + row.actor.handle);
  meta.textContent = parts.join(' · ');
  body.appendChild(meta);

  if (hasLink) {
    const cta = document.createElement('span');
    cta.className = 'inbox-card-cta';
    cta.textContent = t.inboxOpenApp;
    body.appendChild(cta);
  }

  card.appendChild(body);
  return card;
}

// 開いた時点で未読を既読にする。
// 「新着」の色は今回の表示では残したままにして、バッジだけ消す
async function markShownNotificationsRead(rows) {
  const unreadIds = rows.filter(function (r) { return !r.read_at; })
                        .map(function (r) { return r.id; });
  if (unreadIds.length === 0) return;

  const { error } = await supabaseClient
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', unreadIds);

  if (error) {
    console.error('Failed to mark notifications as read:', error.message);
    return;
  }
  await refreshInboxBadge();
}

async function loadInboxPage() {
  const signedOut = document.getElementById('inboxSignedOut');
  const signedIn = document.getElementById('inboxSignedIn');
  if (!signedOut || !signedIn) return; // Inboxページ以外では何もしない

  signedOut.hidden = !!inboxUser;
  signedIn.hidden = !inboxUser;
  if (!inboxUser) return;

  const list = document.getElementById('inboxList');
  const empty = document.getElementById('inboxEmpty');

  const { data, error } = await supabaseClient
    .from('notifications')
    .select('id, type, read_at, created_at, mini_apps(name, url), requests(problem), actor:profiles(handle)')
    .eq('user_id', inboxUser.id)
    .order('created_at', { ascending: false })
    .limit(INBOX_LIMIT);

  list.textContent = '';

  if (error) {
    console.error('Failed to load notifications:', error.message);
    const failed = document.createElement('p');
    failed.className = 'inbox-card-request';
    failed.textContent = t.inboxLoadFailed;
    list.appendChild(failed);
    empty.hidden = true;
    return;
  }

  const rows = data || [];
  empty.hidden = rows.length > 0;
  rows.forEach(function (row) { list.appendChild(buildInboxCard(row)); });

  await markShownNotificationsRead(rows);
}

// ===========================
// 起動
// ===========================

async function initInbox() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  inboxUser = session ? session.user : null;
  await refreshInboxBadge();
  await loadInboxPage();

  // ログイン・ログアウトのたびに、タブの出し分けと一覧を作り直す
  supabaseClient.auth.onAuthStateChange(async function (_event, session) {
    inboxUser = session ? session.user : null;
    await refreshInboxBadge();
    await loadInboxPage();
  });
}

document.addEventListener('DOMContentLoaded', initInbox);
