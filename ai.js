/* ===========================================================
   ai.js — CobbleWorks の AI 機能をブラウザ側から呼ぶための共通係
   ===========================================================

   ここが知っているのは「Edge Function をどう呼ぶか」だけ。
   Gemini APIキーもプロンプトもサーバー側にあるので、このファイルには一切出てこない。

   使い方:
     const res = await AI.searchApps('旅行の持ち物を忘れたくない');
     if (res.ok) { res.results.forEach(...) } else { console.log(res.error); }

   返り値は必ず { ok: true, results, cached } か { ok: false, error, limit }。
   例外を投げないので、呼び出す側は try/catch を書かなくてよい。

   supabase-config.js より後に読み込むこと（SUPABASE_URL などを使うため）。
   =========================================================== */

const AI = (function () {
  const FUNCTION_NAME = 'gemini-ai';

  // ログインしていればその人のトークン、していなければ匿名キーを使う。
  // どちらを使ったかでサーバー側の1日の上限が変わる（未ログインは少なめ）。
  async function getAuthToken() {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session && data.session.access_token) {
        return data.session.access_token;
      }
    } catch (e) {
      /* セッションが取れなくても匿名として続行する */
    }
    return SUPABASE_ANON_KEY;
  }

  async function call(payload) {
    let response;
    try {
      const token = await getAuthToken();
      response = await fetch(SUPABASE_URL + '/functions/v1/' + FUNCTION_NAME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // apikey は Supabase の入口を通るために常に必要。
          // Authorization の方が「誰として使うか」を決める。
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // 通信そのものが失敗した場合（オフラインなど）
      return { ok: false, error: 'network' };
    }

    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      return { ok: false, error: 'bad_response' };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'server_error',
        limit: data.limit,
        signedIn: data.signedIn,
      };
    }

    return Object.assign({ ok: true }, data);
  }

  return {
    // 自然文からミニアプリを探す。lang は理由文を書く言語（未指定なら現在の表示言語）。
    searchApps: function (query, lang) {
      const text = (query || '').trim();
      if (!text) return Promise.resolve({ ok: false, error: 'missing_query' });

      let language = lang;
      if (!language) {
        language = typeof getLanguage === 'function' ? getLanguage() : 'en';
      }

      return call({ task: 'search_apps', query: text, lang: language });
    },
  };
})();
