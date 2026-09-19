// Forgetful Tracker: 時刻の来たreminderにWeb Pushを送るEdge Function。
//
// pg_cronから1分おきに叩かれる想定(特定ユーザーのJWTを持たないため、
// service_role鍵そのものをAuthorizationヘッダに載せて認証する。vt-finnhub-proxyと同じ方式)。
//
// VAPID_PRIVATE_KEY / VAPID_SUBJECT は `supabase secrets set` で登録した値を読む。
// VAPID_PUBLIC_KEYはクライアント(script.js)に埋め込んだものと同じ値を渡す。
//
// reminderは「毎日くりかえす」前提。送信後にnotify_atを次に来る同じ時刻へ進め、
// notifiedはfalseのままにしておく。こうしておくと、ユーザーが二度とアプリを
// 開かなくても翌日以降も通知が届く(忘れっぽさを助けるアプリが、思い出して
// 操作することを要求してはいけない)。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 次に来る同じ時刻(未来になるまで1日ずつ足す)。何日も端末が止まっていた場合も、
// 溜まった分をまとめて鳴らさず次の1回だけにする。
//
// 注: 24時間単位で足すため、夏時間が切り替わる地域では現地時刻が1時間ずれる。
// ユーザーが次にアプリを開いたとき、クライアントが端末のローカル時刻から
// 再計算してnotify_atを上書きするので、そこで自動的に直る。
function nextOccurrence(previous: string | null): string {
  const now = Date.now();
  let next = previous ? new Date(previous).getTime() : now;
  if (!isFinite(next)) next = now;
  while (next <= now) next += DAY_MS;
  return new Date(next).toISOString();
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
      .select("id, device_id, item_id, title, body, notify_at")
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
    // 送信失敗の理由をレスポンスに載せる(cronの記録 net._http_response.content から読めるように)。
    // console.errorだけだとダッシュボードのLogsを見に行かないと分からず、原因調査が難しかった。
    const errors: unknown[] = [];
    for (const reminder of dueReminders) {
      const subscription = subsByDevice.get(reminder.device_id);

      if (!subscription) {
        // 購読情報が無い(通知を無効化した端末など) — 通知済み扱いにして毎分の走査から外す。
        // 再び許可されたら、クライアントのenablePushSync()がnotified:falseで上書きして復活する。
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
        }
        errors.push({
          reminder_id: reminder.id,
          name: err?.name,
          message: String(err?.message ?? err),
          status_code: err?.statusCode,
          body: typeof err?.body === "string" ? err.body.slice(0, 300) : undefined,
          stack: typeof err?.stack === "string" ? err.stack.slice(0, 500) : undefined,
        });
        console.error("push failed for", reminder.id, err);
      }

      // 成功・失敗どちらでも翌日へ進める。失敗した1回を1日中鳴らし直さないため。
      await supabaseAdmin
        .from("forgetful_tracker_reminders")
        .update({
          notify_at: nextOccurrence(reminder.notify_at),
          notified: false,
        })
        .eq("id", reminder.id);
    }

    return json({ sent, total: dueReminders.length, errors });
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
