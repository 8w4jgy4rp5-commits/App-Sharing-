// CobbleWorks: 未配信のお知らせ(notifications)を押し通知で届けるEdge Function。
//
// 解決している問題:
//   Inbox(0038)はサイトに来た人にしか届かない。リクエストを出した人の多くは
//   アプリが出来たあと戻ってこないので、「作ったよ」が本人に伝わらない。
//
// 仕組み:
//   pg_cronから1分おきに叩かれる。notifications から pushed_at が null の行を拾い、
//   その人の全端末に送って pushed_at を埋める。通知を「作る」のはDBのトリガーのままで、
//   ここは配送係に徹する。
//   認証は特定ユーザーのJWTを持たないため、service_role鍵そのものを
//   Authorizationヘッダに載せる方式(forgetful-tracker-pushと同じ)。
//
// 鍵は Forgetful Tracker / Family Schedule と同じものを使う。
// VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT は登録済みのはずなので、
// 新しく発行する必要はない。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SITE_URL = "https://8w4jgy4rp5-commits.github.io/App-Sharing-";

// 1回のcronで配る上限。詰まっても1分後に続きから配られる
const BATCH_SIZE = 50;

// 作られてから日が経ちすぎた通知は配らない。
// 配信が失敗し続けたときに、何日も前の「できました」が突然鳴るのを防ぐ
const MAX_AGE_DAYS = 7;

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

// 文面。サイト側と同じ5言語。
// Inbox(notifications.js)と違い、通知は送った時の言語で固定されるので profiles.locale を見る
const COPY: Record<string, { title: string; body: (app: string) => string }> = {
  en: {
    title: "Your request became an app",
    body: (app) => `${app} is ready. Tap to open it.`,
  },
  ja: {
    title: "あなたのリクエストがアプリになりました",
    body: (app) => `${app} ができました。タップして開けます。`,
  },
  es: {
    title: "Tu petición se convirtió en una app",
    body: (app) => `${app} ya está lista. Toca para abrirla.`,
  },
  zh: {
    title: "你的需求变成了一个应用",
    body: (app) => `${app} 已经做好了，点击即可打开。`,
  },
  hi: {
    title: "आपकी रिक्वेस्ट एक ऐप बन गई",
    body: (app) => `${app} तैयार है। खोलने के लिए टैप करें।`,
  },
};

// 通知をタップしたときの行き先。
// mini_apps.url は投稿者が入れた文字列なので、http/https 以外は使わない
function safeAppUrl(url: unknown) {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (jwt !== serviceRoleKey) {
      return json({ error: "not authenticated" }, 401);
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const oldestAllowed = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, mini_apps(name, url)")
      .eq("type", "app_built")
      .is("pushed_at", null)
      .gte("created_at", oldestAllowed)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (pendingError) {
      console.error(pendingError);
      return json({ error: "query_failed" }, 500);
    }
    if (!pending || pending.length === 0) {
      return json({ sent: 0, total: 0 });
    }

    const userIds = Array.from(new Set(pending.map((row: any) => row.user_id)));

    // 宛先と言語を、人数ぶんまとめて1回ずつ引く
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("user_id, endpoint, subscription")
      .in("user_id", userIds);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, locale")
      .in("id", userIds);

    const subsByUser = new Map<string, any[]>();
    for (const sub of subscriptions ?? []) {
      const list = subsByUser.get(sub.user_id) ?? [];
      list.push(sub);
      subsByUser.set(sub.user_id, list);
    }

    const localeByUser = new Map((profiles ?? []).map((p: any) => [p.id, p.locale]));

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const doneIds: string[] = [];
    // 期限切れの宛先。送信中にテーブルを触ると読みと書きが混ざるので、最後にまとめて消す
    const deadEndpoints: string[] = [];

    for (const row of pending as any[]) {
      const subs = subsByUser.get(row.user_id) ?? [];

      // 通知をオンにしていない人。Inboxには残るので、配信済み扱いにして次から見ない
      if (subs.length === 0) {
        doneIds.push(row.id);
        skipped++;
        continue;
      }

      const copy = COPY[localeByUser.get(row.user_id) as string] ?? COPY.en;
      const appName = row.mini_apps?.name ?? "";
      const payload = JSON.stringify({
        title: copy.title,
        body: copy.body(appName),
        url: safeAppUrl(row.mini_apps?.url) ?? `${SITE_URL}/inbox.html`,
        // 同じ通知が複数端末で二重に積み上がらないように、通知IDで束ねる
        tag: "cobbleworks-" + row.id,
      });

      // 1台でも届けば「配信済み」。全滅したときだけ次のcronで再試行する
      let deliveredToAny = false;

      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription, payload);
          deliveredToAny = true;
        } catch (pushError: any) {
          const statusCode = pushError?.statusCode;
          // 404/410 は「この宛先はもう存在しない」という意味。
          // 消さずに残すと、毎分失敗し続けてログが埋まる
          if (statusCode === 404 || statusCode === 410) {
            deadEndpoints.push(sub.endpoint);
          } else {
            errors.push(`${statusCode ?? "?"}: ${String(pushError?.body ?? pushError).slice(0, 120)}`);
          }
        }
      }

      if (deliveredToAny) {
        doneIds.push(row.id);
        sent++;
      } else if (subs.every((s: any) => deadEndpoints.includes(s.endpoint))) {
        // 宛先が全部期限切れだった。送りようがないので配信済みにする
        doneIds.push(row.id);
        skipped++;
      }
    }

    if (deadEndpoints.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    if (doneIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("notifications")
        .update({ pushed_at: new Date().toISOString() })
        .in("id", doneIds);
      if (updateError) {
        // ここで失敗すると同じ通知をもう一度鳴らしてしまうので、必ず記録に残す
        console.error("failed to stamp pushed_at:", updateError.message);
        errors.push("stamp_failed: " + updateError.message);
      }
    }

    return json({ sent, skipped, total: pending.length, removed: deadEndpoints.length, errors });
  } catch (error) {
    console.error(error);
    return json({ error: String(error) }, 500);
  }
});
