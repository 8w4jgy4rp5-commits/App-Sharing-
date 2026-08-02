// ミニアプリのlocalStorageデータをクラウド(Supabase)と同期する共通ヘルパー。
//
// 設計方針:
// - 各ミニアプリのlocalStorage読み書きは今まで通り同期的なまま。
// - クラウドとの通信(非同期)はこのファイルの中だけで完結させる。
// - 未ログインなら何もしない(従来通りlocalStorageのみで動作)。
//
// 使い方(1つのアプリで複数キーを同期したい場合は、キーごとに呼ぶ):
//   1. index.htmlで supabase-config.js の後に読み込む
//   2. ログイン確認: await AppSync.isLoggedIn()
//   3. 起動時に1回: const remote = await AppSync.pull(APP_SLUG, 'tasks')
//      remote.updatedAt がローカルの更新時刻より新しければローカルへ反映して再描画
//   4. ローカル保存のたびに: AppSync.push(APP_SLUG, 'tasks', value, Date.now())
//   5. 初回でクラウドが空・ローカルにデータがある場合は、呼び出し側でアップロード確認して
//      AppSync.push(...) を呼ぶ(このファイルはダイアログを出さない)

const AppSync = (function () {
  const PUSH_DEBOUNCE_MS = 1500;
  const pushTimers = {};

  async function isLoggedIn() {
    const { data } = await supabaseClient.auth.getSession();
    return !!data.session;
  }

  // クラウド側の値を取得する。行がなければnullを返す。
  // 戻り値: { value, updatedAt } | null
  async function pull(appSlug, key) {
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session.session) return null;

    const { data, error } = await supabaseClient
      .from('user_app_data')
      .select('value, updated_at')
      .eq('owner_id', session.session.user.id)
      .eq('app_slug', appSlug)
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('AppSync.pull エラー:', error.message);
      return null;
    }
    if (!data) return null;

    return { value: data.value, updatedAt: new Date(data.updated_at).getTime() };
  }

  // 即座にクラウドへ保存する(await可能)。移行アップロード等、確実に完了を待ちたい場合に使う。
  async function pushNow(appSlug, key, value, updatedAtMs) {
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session.session) return false;

    const { error } = await supabaseClient.from('user_app_data').upsert({
      owner_id: session.session.user.id,
      app_slug: appSlug,
      key: key,
      value: value,
      updated_at: new Date(updatedAtMs || Date.now()).toISOString()
    });

    if (error) {
      console.error('AppSync.push エラー:', error.message);
      return false;
    }
    return true;
  }

  // 通常の保存操作から呼ぶ用。連続保存をまとめるため少し遅延させてから送る。
  function push(appSlug, key, value, updatedAtMs) {
    const timerKey = appSlug + ':' + key;
    if (pushTimers[timerKey]) clearTimeout(pushTimers[timerKey]);
    pushTimers[timerKey] = setTimeout(function () {
      pushNow(appSlug, key, value, updatedAtMs);
    }, PUSH_DEBOUNCE_MS);
  }

  return { isLoggedIn: isLoggedIn, pull: pull, push: push, pushNow: pushNow };
})();
