// Virtual Trader: Finnhubへの銘柄検索/現在値取得を中継するEdge Function。
//
// フロントにFinnhub APIキーを持たせないため、キーはユーザーごとにvt_finnhub_keysへ
// 保存してもらい、ここでservice_role権限だけが読み出してFinnhubを呼び出す。
// 価格キャッシュ(vt_price_cache/vt_price_ticks)への書き込みもここでだけ行う
// （テーブルのRLSはクライアントからのselectしか許可していない）。
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY はSupabaseが全Edge Functionに自動注入する
// 環境変数なので、追加のsecrets登録は不要。
//
// action: "cron_refresh" は、ユーザーのブラウザが開いていなくても価格を記録し続ける
// ためのバッチ更新。pg_cronから1分おきに叩かれる想定で、特定ユーザーのJWTを持たない
// ため、service_role鍵そのものをAuthorizationヘッダに載せて認証する。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const CACHE_FRESH_MS = 60 * 1000; // これより新しいキャッシュがあればFinnhubを叩かない

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

// Finnhubから最新価格を取得し、価格キャッシュ/ティック履歴に書き込む共通処理。
// 取得できなければnullを返す。
async function fetchAndCacheQuote(supabaseAdmin: any, symbol: string, finnhubKey: string) {
  const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${finnhubKey}`);
  if (!res.ok) return null;
  const quote = await res.json();
  if (!quote || typeof quote.c !== "number" || quote.c === 0) return null;

  const updatedAt = new Date().toISOString();

  await supabaseAdmin.from("vt_price_cache").upsert({
    symbol,
    price: quote.c,
    prev_close: quote.pc,
    updated_at: updatedAt,
  });

  await supabaseAdmin.from("vt_price_ticks").insert({
    symbol,
    price: quote.c,
    ts: updatedAt,
  });

  return { price: quote.c, prevClose: quote.pc, updatedAt };
}

// 保有中/最近見られた銘柄をまとめて更新する。ユーザーのFinnhubキーは
// (今のところ個人利用前提のため)登録済みのものを1つ拝借して使う。
async function handleCronRefresh(supabaseAdmin: any) {
  const { data: positions } = await supabaseAdmin.from("vt_positions").select("symbol");
  const { data: watched } = await supabaseAdmin.from("vt_watched_symbols").select("symbol");

  const symbols = Array.from(
    new Set([
      ...(positions ?? []).map((p: any) => p.symbol),
      ...(watched ?? []).map((w: any) => w.symbol),
    ]),
  );

  if (symbols.length === 0) {
    return json({ refreshed: 0, total: 0 });
  }

  const { data: keyRow } = await supabaseAdmin
    .from("vt_finnhub_keys")
    .select("api_key")
    .limit(1)
    .maybeSingle();

  if (!keyRow?.api_key) {
    return json({ error: "no_finnhub_key_registered", refreshed: 0, total: symbols.length });
  }

  let refreshed = 0;
  for (const symbol of symbols) {
    const result = await fetchAndCacheQuote(supabaseAdmin, symbol, keyRow.api_key as string);
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
    const userId = userData.user.id;

    const { data: keyRow } = await supabaseAdmin
      .from("vt_finnhub_keys")
      .select("api_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (!keyRow?.api_key) {
      return json({ error: "no_finnhub_key" }, 400);
    }
    const finnhubKey = keyRow.api_key as string;

    if (action === "search") {
      const query = String(body.query ?? "").trim();
      if (!query) return json({ error: "missing query" }, 400);

      const res = await fetch(
        `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${finnhubKey}`,
      );
      if (!res.ok) return json({ error: "finnhub_error" }, 502);
      const data = await res.json();

      const results = (data.result ?? [])
        .filter((r: any) => r.type === "Common Stock" && !String(r.symbol).includes("."))
        .slice(0, 20)
        .map((r: any) => ({ symbol: r.symbol, description: r.description }));

      return json({ results });
    }

    if (action === "quote") {
      const symbol = String(body.symbol ?? "").trim().toUpperCase();
      if (!symbol) return json({ error: "missing symbol" }, 400);

      await supabaseAdmin
        .from("vt_watched_symbols")
        .upsert({ symbol, last_viewed_at: new Date().toISOString() });

      const { data: cached } = await supabaseAdmin
        .from("vt_price_cache")
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

      const result = await fetchAndCacheQuote(supabaseAdmin, symbol, finnhubKey);
      if (!result) return json({ error: "symbol_not_found" }, 404);

      return json({
        symbol,
        price: result.price,
        prevClose: result.prevClose,
        updatedAt: result.updatedAt,
        source: "finnhub",
      });
    }

    if (action === "candles") {
      const symbol = String(body.symbol ?? "").trim().toUpperCase();
      if (!symbol) return json({ error: "missing symbol" }, 400);

      const to = Math.floor(Date.now() / 1000);
      const from = to - 180 * 24 * 60 * 60; // 過去180日分

      const res = await fetch(
        `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${finnhubKey}`,
      );
      if (!res.ok) return json({ error: "finnhub_error", status: res.status }, 502);
      const data = await res.json();

      if (!data || data.s !== "ok") {
        return json({ error: "no_historical_data", raw: data }, 404);
      }

      const candles = data.t.map((t: number, i: number) => ({
        time: t,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
      }));

      return json({ candles });
    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
