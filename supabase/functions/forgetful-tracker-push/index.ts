// Forgetful Tracker: 時刻の来たreminderにWeb Pushを送るEdge Function。
//
// pg_cronから1分おきに叩かれる想定(特定ユーザーのJWTを持たないため、
// service_role鍵そのものをAuthorizationヘッダに載せて認証する。vt-finnhub-proxyと同じ方式)。
//
// VAPID_PRIVATE_KEY / VAPID_SUBJECT は `supabase secrets set` で登録した値を読む。
// VAPID_PUBLIC_KEYはクライアント(script.js)に埋め込んだものと同じ値を渡す。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey,
    );

    const { data: dueReminders, error: dueError } = await supabaseAdmin
      .from("forgetful_tracker_reminders")
      .select("id, device_id, item_id, title, body")
      .eq("notified", false)
      .lte("notify_at", new Date().toISOString())
      .limit(200);

    if (dueError) {
      console.error(dueError);
      return json({ error: "query_failed" }, 500);
    }
    if (!dueReminders || dueReminders.length === 0) {
      return json({ sent: 0, total: 0 });
    }

    const deviceIds = Array.from(new Set(dueReminders.map((r: any) => r.device_id)));
    const { data: subscriptions } = await supabaseAdmin
      .from("forgetful_tracker_subscriptions")
      .select("device_id, subscription")
      .in("device_id", deviceIds);

    const subsByDevice = new Map(
      (subscriptions ?? []).map((s: any) => [s.device_id, s.subscription]),
    );

    let sent = 0;
    for (const reminder of dueReminders) {
      const subscription = subsByDevice.get(reminder.device_id);

      if (!subscription) {
        // 購読情報が無い(通知を無効化した端末など) — 通知済み扱いにして無限リトライを防ぐ
        await supabaseAdmin
          .from("forgetful_tracker_reminders")
          .update({ notified: true })
          .eq("id", reminder.id);
        continue;
      }

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: reminder.title,
            body: reminder.body,
            tag: "forgetful-" + reminder.item_id,
          }),
        );
        sent++;
      } catch (err: any) {
        // 410/404 = ブラウザ側で購読が失効している。以後送っても無駄なので購読を削除する。
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabaseAdmin
            .from("forgetful_tracker_subscriptions")
            .delete()
            .eq("device_id", reminder.device_id);
        } else {
          console.error("push failed for", reminder.id, err);
        }
      }

      await supabaseAdmin
        .from("forgetful_tracker_reminders")
        .update({ notified: true })
        .eq("id", reminder.id);
    }

    return json({ sent, total: dueReminders.length });
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
