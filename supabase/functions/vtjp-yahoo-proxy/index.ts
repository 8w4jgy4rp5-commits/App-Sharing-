// Virtual Trader JP: 東証銘柄の検索/現在値取得を中継するEdge Function。
//
// 米国版(vt-finnhub-proxy)と違い、上流のYahoo Financeの検索/チャートエンドポイントは
// APIキーを必要としないため、ユーザーごとのキー保存・読み出しは行わない。
// それでも、この関数自体を未認証の第三者が上流APIへの踏み台として乱用するのを防ぐため、
// search/quoteはこれまで通りSupabaseの認証済みユーザーであることを要求する。
//
// 価格キャッシュ(vtjp_price_cache/vtjp_price_ticks)への書き込みもここでだけ行う
// （テーブルのRLSはクライアントからのselectしか許可していない）。
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY はSupabaseが全Edge Functionに自動注入する
// 環境変数なので、追加のsecrets登録は不要。
//
// action: "cron_refresh" は、ユーザーのブラウザが開いていなくても価格を記録し続ける
// ためのバッチ更新。pg_cronから1分おきに叩かれる想定で、特定ユーザーのJWTを持たない
// ため、service_role鍵そのものをAuthorizationヘッダに載せて認証する。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH_BASE = "https://query1.finance.yahoo.com/v1/finance/search";
const CACHE_FRESH_MS = 60 * 1000; // これより新しいキャッシュがあればYahooを叩かない

// チャートの期間切り替え。米国版はFinnhub無料キーで/stock/candle(日足履歴)が
// 使えず、自前で貯めた分足しか描けなかったが、Yahooのchartエンドポイントは
// キー無しで数ヶ月分の日足OHLCを返すため、証券会社アプリに近い日足チャートを
// 初回表示から出せる。
const CANDLE_TIMEFRAMES: Record<string, { range: string; interval: string; daily: boolean }> = {
  "1d": { range: "1d", interval: "5m", daily: false },
  "1mo": { range: "1mo", interval: "1d", daily: true },
  "6mo": { range: "6mo", interval: "1d", daily: true },
  "1y": { range: "1y", interval: "1d", daily: true },
};

// 日足の足のラベルは「その足がどの立会日か」を示したいので、UTCの生の日付ではなく
// 東京時間に直した日付にする。en-CAロケールはYYYY-MM-DD形式を返す。
const tokyoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Yahoo Financeの非公式エンドポイントはUser-Agentが無いブラウザ以外からのリクエストを
// 弾くことがあるため、一般的なブラウザのUser-Agentを付けて呼び出す。
const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// 東証銘柄コードだけを通す。これが無いと、認証済みユーザーが quote/candles に
// 'AAPL' や暗号資産ペアを直接投げるだけで価格キャッシュに載せられてしまい、
// 「日本株の練習アプリ」なのに米国株を建玉できてしまう。
// 東証コードは4桁数字か、近年導入された英数字4文字(例: 130A)のいずれか。
const JP_SYMBOL_RE = /^[0-9][0-9A-Z]{3}\.T$/;

// 「.T」を伴わない裸の銘柄コード（7203 など）。
const JP_CODE_RE = /^[0-9][0-9A-Z]{3}$/;

// cron_refreshが1回で叩く銘柄数の上限。watched_symbolsが膨らんでも
// Edge Functionの実行時間上限やYahoo側のレート制限を超えないようにする。
const CRON_MAX_SYMBOLS = 40;
const CRON_WATCHED_WINDOW_MS = 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Yahoo Financeのチャートエンドポイントから最新価格を取得し、価格キャッシュ/ティック履歴に
// 書き込む共通処理。取得できなければnullを返す。
async function fetchAndCacheQuote(supabaseAdmin: any, symbol: string) {
  const res = await fetch(
    `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?range=1d&interval=1m`,
    { headers: YAHOO_HEADERS },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const updatedAt = new Date().toISOString();

  // updated_at は「こちらが取りに行った時刻」、market_time は「その値が板についた時刻」。
  // 両者を分けておかないと、休場日にYahooが前営業日の終値を返し続けるのを
  // 常に新鮮な価格だと誤認してしまう（vtjp_place_orderの陳腐化チェックはmarket_timeを見る）。
  const marketTime = typeof meta.regularMarketTime === "number"
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : null;

  await supabaseAdmin.from("vtjp_price_cache").upsert({
    symbol,
    price: meta.regularMarketPrice,
    prev_close: meta.previousClose ?? meta.chartPreviousClose ?? null,
    market_time: marketTime,
    updated_at: updatedAt,
  });

  await supabaseAdmin.from("vtjp_price_ticks").insert({
    symbol,
    price: meta.regularMarketPrice,
    ts: updatedAt,
  });

  return { price: meta.regularMarketPrice, prevClose: meta.previousClose, updatedAt };
}

// 銘柄コードを検索APIを介さずに直接解決する。
//
// Yahooの検索は社名で引くと米国ADRや欧州上場を優先し、東証の.T行を1件も返さないことがある
// (実測: "sony" では 6758.T が結果に現れない)。また日本語のクエリはHTTP 400で弾かれる。
// つまり社名検索は当てにならないが、コード指定は必ず当たる。だからコードで引く経路を
// 検索とは別に用意し、「コードさえ分かれば確実に辿り着ける」状態を保証する。
async function resolveSymbol(symbol: string) {
  const res = await fetch(
    `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
    { headers: YAHOO_HEADERS },
  );
  if (!res.ok) return null;
  const payload = await res.json();
  const meta = payload?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  return {
    symbol,
    description: meta.longName || meta.shortName || symbol,
  };
}

// 指定期間のローソク足を取得する。
// 失敗時も throw せず {error, detail} を返し、呼び出し側がHTTP 200で本文として返す。
// (米国版では上流エラーを502で返していたため、supabase-jsのinvoke()が本文を
//  握り潰してしまい「チャートが出ないが理由が分からない」状態になった。その反省。)
async function fetchCandles(symbol: string, timeframe: string) {
  const tf = CANDLE_TIMEFRAMES[timeframe];
  if (!tf) return { error: "invalid_timeframe", detail: timeframe };

  const url =
    `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}` +
    `?range=${tf.range}&interval=${tf.interval}&includePrePost=false`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) return { error: "yahoo_error", detail: `HTTP ${res.status}` };

  const payload = await res.json();

  const upstreamError = payload?.chart?.error;
  if (upstreamError) {
    return {
      error: "yahoo_error",
      detail: upstreamError.description ?? upstreamError.code ?? "unknown upstream error",
    };
  }

  const result = payload?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];

  if (!quote || timestamps.length === 0) {
    return { error: "no_historical_data", detail: "upstream returned no bars" };
  }

  // Yahooは未確定の足や売買が成立しなかった時間帯をnullで返してくる。
  // nullのままlightweight-chartsへ渡すと描画が壊れるのでここで落とす。
  // 同じ時刻の足が重複することもあるためMapで後勝ちにまとめる。
  const byTime = new Map<string | number, unknown>();
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    if (open == null || high == null || low == null || close == null) continue;

    const time = tf.daily
      ? tokyoDateFormatter.format(new Date(timestamps[i] * 1000))
      : timestamps[i];

    byTime.set(time, { time, open, high, low, close });
  }

  const candles = Array.from(byTime.values()) as Array<{ time: string | number }>;
  candles.sort((a, b) =>
    tf.daily
      ? String(a.time).localeCompare(String(b.time))
      : Number(a.time) - Number(b.time)
  );

  if (candles.length === 0) {
    return { error: "no_historical_data", detail: "every bar in the range was empty" };
  }

  return { symbol, timeframe, daily: tf.daily, candles };
}

// 保有中/最近見られた銘柄をまとめて更新する。
async function handleCronRefresh(supabaseAdmin: any) {
  const { data: positions } = await supabaseAdmin.from("vtjp_positions").select("symbol");

  // 最近見られていない銘柄まで毎分取りに行かない。放置すると銘柄数に比例して
  // 実行時間が伸び続け、いずれEdge Functionのタイムアウトに当たる。
  const { data: watched } = await supabaseAdmin
    .from("vtjp_watched_symbols")
    .select("symbol")
    .gte("last_viewed_at", new Date(Date.now() - CRON_WATCHED_WINDOW_MS).toISOString())
    .order("last_viewed_at", { ascending: false })
    .limit(CRON_MAX_SYMBOLS);

  const symbols = Array.from(
    new Set([
      ...(positions ?? []).map((p: any) => p.symbol),
      ...(watched ?? []).map((w: any) => w.symbol),
    ]),
  )
    .filter((s: string) => JP_SYMBOL_RE.test(s))
    .slice(0, CRON_MAX_SYMBOLS);

  if (symbols.length === 0) {
    return json({ refreshed: 0, total: 0 });
  }

  let refreshed = 0;
  for (const symbol of symbols) {
    const result = await fetchAndCacheQuote(supabaseAdmin, symbol);
    if (result) refreshed++;
  }

  return json({ refreshed, total: symbols.length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "cron_refresh") {
      if (jwt !== serviceRoleKey) {
        return json({ error: "not authenticated" }, 401);
      }
      return await handleCronRefresh(supabaseAdmin);
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return json({ error: "not authenticated" }, 401);
    }

    // 以降、上流やデータ起因の失敗はHTTP 200 + {error, detail} で返す。
    // 非2xxで返すとsupabase-jsのinvoke()が本文を捨ててしまい、フロントに
    // 「non-2xx status code」としか出ず原因が追えなくなるため。
    if (action === "search") {
      const query = String(body.query ?? "").trim();
      if (!query) return json({ error: "missing_query" });

      // 銘柄コードで引かれた場合は検索APIを使わず直接解決する（resolveSymbol参照）。
      const upper = query.toUpperCase();
      const asSymbol = JP_SYMBOL_RE.test(upper)
        ? upper
        : (JP_CODE_RE.test(upper) ? upper + ".T" : null);

      if (asSymbol) {
        const hit = await resolveSymbol(asSymbol);
        return json({ results: hit ? [hit] : [] });
      }

      // Yahooの検索エンドポイントは非ASCIIのクエリをHTTP 400で拒否するため、
      // 日本語で入力された場合は上流を叩かずに理由を返す。
      if (/[^\x00-\x7F]/.test(query)) {
        return json({ error: "japanese_search_unsupported" });
      }

      // 社名で引くと海外上場やADRが上位を占め、東証の.T行が20件に入りきらず
      // 「該当なし」になってしまうので、絞り込む前に多めに取っておく。
      const res = await fetch(
        `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=50`,
        { headers: YAHOO_HEADERS },
      );
      if (!res.ok) return json({ error: "yahoo_error", detail: `HTTP ${res.status}` });
      const data = await res.json();

      const results = (data.quotes ?? [])
        .filter((r: any) =>
          (r.quoteType === "EQUITY" || r.quoteType === "ETF") &&
          r.exchange === "JPX" &&
          JP_SYMBOL_RE.test(String(r.symbol ?? ""))
        )
        .slice(0, 20)
        .map((r: any) => ({ symbol: r.symbol, description: r.longname || r.shortname || r.symbol }));

      return json({ results });
    }

    if (action === "quote") {
      const symbol = String(body.symbol ?? "").trim().toUpperCase();
      if (!symbol) return json({ error: "missing_symbol" });
      if (!JP_SYMBOL_RE.test(symbol)) return json({ error: "not_a_tokyo_symbol", detail: symbol });

      await supabaseAdmin
        .from("vtjp_watched_symbols")
        .upsert({ symbol, last_viewed_at: new Date().toISOString() });

      const { data: cached } = await supabaseAdmin
        .from("vtjp_price_cache")
        .select("price, prev_close, updated_at")
        .eq("symbol", symbol)
        .maybeSingle();

      const isFresh =
        !!cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_FRESH_MS;

      if (isFresh) {
        return json({
          symbol,
          price: cached.price,
          prevClose: cached.prev_close,
          updatedAt: cached.updated_at,
          source: "cache",
        });
      }

      const result = await fetchAndCacheQuote(supabaseAdmin, symbol);
      if (!result) return json({ error: "symbol_not_found", detail: symbol });

      return json({
        symbol,
        price: result.price,
        prevClose: result.prevClose,
        updatedAt: result.updatedAt,
        source: "yahoo",
      });
    }

    if (action === "candles") {
      const symbol = String(body.symbol ?? "").trim().toUpperCase();
      const timeframe = String(body.timeframe ?? "6mo").trim();
      if (!symbol) return json({ error: "missing_symbol" });
      if (!JP_SYMBOL_RE.test(symbol)) return json({ error: "not_a_tokyo_symbol", detail: symbol });

      // データが取れなかった場合もHTTP 200で理由を本文に載せて返す（fetchCandles参照）。
      return json(await fetchCandles(symbol, timeframe));
    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
