// CobbleWorks の AI 機能（Gemini）をまとめて中継する Edge Function。
//
// なぜ中継するのか:
//   Gemini APIキーは「みんなで共有する1本」なので、ブラウザに置くと即座に盗まれて
//   無料枠を使い切られる。キーはSupabaseのシークレットに置き、ここだけが読み出す。
//
// なぜプロンプトをここに置くのか:
//   フロントから送るのは task 名と検索文だけ。実際の指示文（プロンプト）はこのファイル内に
//   固定してある。フロントから自由な指示文を受け取れるようにすると、共有キーが
//   「無料の汎用チャット」として使われてしまうため。
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Supabase が自動で入れてくれる環境変数。
// GEMINI_API_KEY だけは自分で Settings → Edge Functions → Secrets に登録する。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- 調整できる数字（ここだけ書き換えれば変えられる） ----
const LIMIT_ANON = 3;     // 未ログイン: 1人1日あたり
const LIMIT_USER = 20;    // ログイン済み: 1人1日あたり
const LIMIT_GLOBAL = 500; // 全員合計: 1日あたり（無料枠を守る最終ライン）
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 同じ検索文の答えを使い回す期間
const MAX_QUERY_LEN = 200;
const MAX_RESULTS = 5;

// Gemini のモデル名。速くて安い flash 系を使う。
// 使えない名前だと 404 が返るので、そのときは AI Studio で現行のモデル名を確認して差し替える。
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_API_REVISION = "2026-05-20";

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

// 検索文をキャッシュの鍵にするために正規化する（前後の空白・大文字小文字・連続空白の違いを吸収）
function normalizeQuery(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// 未ログインの人を数えるための目印。IPそのものは保存したくないのでハッシュにする。
async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Gemini の応答から本文テキストを取り出す。
// 通常は output_text に入っているが、形が変わった場合に備えて steps の中も見る。
function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;

  for (const step of data?.steps ?? []) {
    for (const part of step?.content ?? []) {
      if (part?.type === "text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

// ---- task: search_apps ----
// ユーザーの「やりたいこと」の文章から、合いそうなミニアプリを選ぶ。
async function handleSearchApps(supabaseAdmin: any, geminiKey: string, query: string, lang: string) {
  const { data: apps, error } = await supabaseAdmin
    .from("mini_apps")
    .select("id, name, description, url, target_users, category")
    .limit(300);

  if (error || !apps?.length) return { results: [] };

  // アプリには番号を振ってGeminiに渡し、返事も番号でもらう。
  // こうすると、存在しないアプリ名をでっち上げられても番号の範囲外として捨てられる。
  const catalog = apps
    .map((app: any, i: number) =>
      `${i + 1}. ${app.name} [${app.category ?? "other"}] - ${app.description ?? ""}` +
      (app.target_users ? ` (for: ${app.target_users})` : ""),
    )
    .join("\n");

  const prompt = [
    "You match a person's need to mini apps from a fixed catalog.",
    "",
    "The catalog (each line starts with its number):",
    catalog,
    "",
    "The person wrote this (it may be in any language):",
    query,
    "",
    "Pick the apps that would genuinely help with what they described.",
    `Return at most ${MAX_RESULTS}, best first, using the numbers from the catalog.`,
    "If nothing in the catalog genuinely fits, return an empty list.",
    "Never pad the list with weak matches.",
    'Write each "reason" as one short sentence (15 words max) saying how that app helps,',
    `written in this language code: ${lang}.`,
  ].join("\n");

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": geminiKey,
      "Content-Type": "application/json",
      "Api-Revision": GEMINI_API_REVISION,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  n: { type: "integer" },
                  reason: { type: "string" },
                },
                required: ["n", "reason"],
              },
            },
          },
          required: ["results"],
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("gemini error", res.status, detail.slice(0, 500));
    return { error: "gemini_error", status: res.status };
  }

  const text = extractText(await res.json());
  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (_e) {
    console.error("gemini returned non-JSON", text.slice(0, 300));
    return { error: "gemini_bad_json" };
  }

  // 番号を実際のアプリに戻す。範囲外・重複はここで捨てる。
  const seen = new Set<number>();
  const results = (parsed.results ?? [])
    .filter((r: any) => {
      const n = Number(r?.n);
      if (!Number.isInteger(n) || n < 1 || n > apps.length || seen.has(n)) return false;
      seen.add(n);
      return true;
    })
    .slice(0, MAX_RESULTS)
    .map((r: any) => {
      const app = apps[Number(r.n) - 1];
      // 画面に出す名前とURLはDBの値だけを使う（AIが作った文字列をリンクにはしない）
      return {
        id: app.id,
        name: app.name,
        description: app.description,
        url: app.url,
        category: app.category,
        reason: String(r.reason ?? "").slice(0, 200),
      };
    });

  return { results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return json({ error: "missing_gemini_key" }, 500);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    if (body?.task !== "search_apps") return json({ error: "unknown_task" }, 400);

    const rawQuery = String(body.query ?? "");
    if (!rawQuery.trim()) return json({ error: "missing_query" }, 400);
    if (rawQuery.length > MAX_QUERY_LEN) return json({ error: "query_too_long" }, 400);

    const lang = /^[a-z]{2}$/.test(String(body.lang ?? "")) ? String(body.lang) : "en";
    const queryKey = `search_apps:${lang}:${normalizeQuery(rawQuery)}`;

    // 1) キャッシュにあればGeminiを呼ばない（回数も消費しない）
    const { data: cached } = await supabaseAdmin
      .from("ai_search_cache")
      .select("result, created_at")
      .eq("query_key", queryKey)
      .maybeSingle();

    if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
      return json({ ...cached.result, cached: true });
    }

    // 2) 誰からの依頼かを決める。ログインしていればユーザーID、していなければIPのハッシュ。
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    let actorKey = "";
    let limit = LIMIT_ANON;

    if (jwt && jwt !== Deno.env.get("SUPABASE_ANON_KEY")) {
      const { data: userData } = await supabaseAdmin.auth.getUser(jwt);
      if (userData?.user) {
        actorKey = `user:${userData.user.id}`;
        limit = LIMIT_USER;
      }
    }

    if (!actorKey) {
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
      actorKey = `ip:${await sha256(ip + serviceRoleKey)}`;
    }

    // 3) 回数を確認して1つ増やす
    const { data: quota, error: quotaError } = await supabaseAdmin.rpc("ai_usage_bump", {
      p_actor_key: actorKey,
      p_limit: limit,
      p_global_limit: LIMIT_GLOBAL,
    });

    if (quotaError) {
      console.error("quota error", quotaError);
      return json({ error: "internal_error" }, 500);
    }

    if (!quota?.allowed) {
      return json({
        error: quota?.reason === "global_limit" ? "global_limit" : "limit_reached",
        limit,
        signedIn: actorKey.startsWith("user:"),
      }, 429);
    }

    // 4) Geminiに聞く
    const result: any = await handleSearchApps(supabaseAdmin, geminiKey, rawQuery.trim(), lang);
    if (result.error) return json(result, 502);

    // 5) 次の人のためにキャッシュしておく
    await supabaseAdmin
      .from("ai_search_cache")
      .upsert({ query_key: queryKey, result, created_at: new Date().toISOString() });

    return json({ ...result, remaining: Math.max(0, limit - (quota.used ?? 0)) });
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
