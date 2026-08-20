// Family Schedule: 予定/やることが追加・編集(保存)された瞬間に、そのグループの
// 他のメンバー全員へWeb Pushを送るEdge Function。
//
// forgetful-tracker-push (pg_cronから1分おきに叩かれる)と違い、こちらは
// DBトリガー(notify_family_item_added, pg_net経由)から都度1件ずつ呼び出される想定。
// 認証方式は同じくservice_role鍵をそのままAuthorizationヘッダに載せる方式
// (vt-finnhub-proxy / forgetful-tracker-pushと同じ)。
//
// VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT はプロジェクト共通のSecretなので、
// forgetful-tracker-push側で登録済みならこのFunctionからもそのまま読める
// (別途登録し直す必要はない)。

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

    const payload = await req.json();
    const groupId = payload.group_id;
    const createdBy = payload.created_by;
    const title: string = payload.title ?? "";
    const itemType = payload.item_type === "todo" ? "to-do" : "schedule";
    const itemDate = payload.item_date;
    const createdByNickname = payload.created_by_nickname ?? "Someone";
    const action = payload.action === "updated" ? "updated" : "added";

    if (!groupId) {
      return json({ error: "missing group_id" }, 400);
    }

    const { data: group } = await supabaseAdmin
      .from("family_groups")
      .select("name")
      .eq("id", groupId)
      .maybeSingle();

    const { data: recipients, error: membersError } = await supabaseAdmin
      .from("family_members")
      .select("user_id")
      .eq("group_id", groupId)
      .neq("user_id", createdBy);

    if (membersError) {
      console.error(membersError);
      return json({ error: "query_failed" }, 500);
    }
    if (!recipients || recipients.length === 0) {
      return json({ sent: 0, total: 0 });
    }

    const recipientIds = recipients.map((m: any) => m.user_id);
    const { data: subscriptions } = await supabaseAdmin
      .from("family_push_subscriptions")
      .select("user_id, subscription")
      .in("user_id", recipientIds);

    if (!subscriptions || subscriptions.length === 0) {
      return json({ sent: 0, total: 0 });
    }

    const notifTitle = group?.name ? group.name : "Family Schedule";
    let bodyText = createdByNickname + " " + action + " a " + itemType + ": " + title;
    if (itemDate) bodyText += " (" + itemDate + ")";

    let sent = 0;
    const errors: unknown[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({ title: notifTitle, body: bodyText, tag: "family-schedule-" + groupId }),
        );
        sent++;
      } catch (err: any) {
        // 410/404 = ブラウザ側で購読が失効している。以後送っても無駄なので購読を削除する。
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabaseAdmin
            .from("family_push_subscriptions")
            .delete()
            .eq("user_id", sub.user_id);
        }
        errors.push({
          user_id: sub.user_id,
          name: err?.name,
          message: String(err?.message ?? err),
          status_code: err?.statusCode,
        });
        console.error("push failed for", sub.user_id, err);
      }
    }

    return json({ sent, total: subscriptions.length, errors });
  } catch (err) {
    console.error(err);
    return json({ error: "internal_error" }, 500);
  }
});
