// CobbleWorks: 未送信のお知らせ(notifications)をメールで届けるEdge Function。
//
// 解決している問題:
//   Inbox(0038)はサイトに来た人にしか届かない。リクエストを出した人の多くは
//   アプリが出来たあとサイトに戻ってこないので、「作ったよ」が本人に伝わらない。
//
// 仕組み:
//   pg_cronから5分おきに叩かれる。notifications から emailed_at が null の行を拾い、
//   1通送るごとに emailed_at を埋める。通知を「作る」のはDBのトリガーのままで、
//   ここは配送係に徹する(Web Pushを足すときも同じ形で並べられる)。
//   認証は特定ユーザーのJWTを持たないため、service_role鍵そのものを
//   Authorizationヘッダに載せる方式(forgetful-tracker-pushと同じ)。
//
// 必要なシークレット(`supabase secrets set` で登録):
//   BREVO_API_KEY       : Brevo の API キー
//   BREVO_SENDER_EMAIL  : Brevo で認証済みの送信元アドレス
//   BREVO_SENDER_NAME   : 差出人の表示名(省略時 "CobbleWorks")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://8w4jgy4rp5-commits.github.io/App-Sharing-";

// 1回のcronで送る上限。詰まっても5分後にまた続きから送られる
const BATCH_SIZE = 50;

// 作られてから日が経ちすぎた通知は送らない。
// 送信が失敗し続けたときに、いつまでも再試行して古い知らせを送るのを防ぐ
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

// 文面。サイト側と同じ5言語。notifications.js と違い、
// メールは「送った時の言語」で固定されるので profiles.locale を見て選ぶ
type Copy = {
  subject: string;
  heading: string;
  intro: string;
  forRequest: string;
  cta: string;
  footer: string;
  settings: string;
};

const COPY: Record<string, Copy> = {
  en: {
    subject: "A mini app was built for your request",
    heading: "Your request became an app",
    intro: "Someone on CobbleWorks built a free mini app for the request you posted.",
    forRequest: "Your request",
    cta: "Open the app",
    footer: "You're getting this because you posted a request on CobbleWorks.",
    settings: "Turn these emails off",
  },
  ja: {
    subject: "あなたのリクエストからミニアプリができました",
    heading: "あなたのリクエストがアプリになりました",
    intro: "CobbleWorksで、あなたが出したリクエストに対して無料のミニアプリが作られました。",
    forRequest: "あなたのリクエスト",
    cta: "アプリを開く",
    footer: "CobbleWorksにリクエストを投稿した方にお送りしています。",
    settings: "このメールを止める",
  },
  es: {
    subject: "Se creó una mini app para tu petición",
    heading: "Tu petición se convirtió en una app",
    intro: "Alguien en CobbleWorks creó una mini app gratuita para la petición que publicaste.",
    forRequest: "Tu petición",
    cta: "Abrir la app",
    footer: "Recibes esto porque publicaste una petición en CobbleWorks.",
    settings: "Desactivar estos correos",
  },
  zh: {
    subject: "有人为你的需求做了一个小应用",
    heading: "你的需求变成了一个应用",
    intro: "有人在 CobbleWorks 上为你发布的需求做了一个免费的小应用。",
    forRequest: "你的需求",
    cta: "打开应用",
    footer: "你收到这封邮件，是因为你在 CobbleWorks 上发布过需求。",
    settings: "关闭这类邮件",
  },
  hi: {
    subject: "आपकी रिक्वेस्ट के लिए एक मिनी ऐप बना है",
    heading: "आपकी रिक्वेस्ट एक ऐप बन गई",
    intro: "CobbleWorks पर किसी ने आपकी रिक्वेस्ट के लिए एक मुफ़्त मिनी ऐप बनाया है।",
    forRequest: "आपकी रिक्वेस्ट",
    cta: "ऐप खोलें",
    footer: "आपको यह इसलिए मिला क्योंकि आपने CobbleWorks पर एक रिक्वेस्ट पोस्ट की थी।",
    settings: "ये ईमेल बंद करें",
  },
};

// 本文にはユーザーが書いた文字(リクエスト内容・アプリ名)がそのまま入るため、
// HTMLに埋める前に必ず無害化する
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ボタンのリンク先は http/https だけに限る。
// mini_apps.url は投稿者が入れた文字列なので、javascript: や data: が
// そのままメールのボタンになるのを防ぐ（URLとして読めない値もここで落ちる）
function safeAppUrl(url: unknown) {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function buildEmail(copy: Copy, appName: string, appUrl: string | null, requestText: string) {
  const lines = [
    `<h1 style="font-size:20px;margin:0 0 16px;color:#3E2F23;">${escapeHtml(copy.heading)}</h1>`,
    `<p style="margin:0 0 16px;color:#5A4636;">${escapeHtml(copy.intro)}</p>`,
    `<p style="font-size:18px;font-weight:700;margin:0 0 8px;color:#3E2F23;">${escapeHtml(appName)}</p>`,
  ];

  if (requestText) {
    lines.push(
      `<p style="margin:0 0 20px;color:#7A6552;">${escapeHtml(copy.forRequest)}: ${escapeHtml(requestText)}</p>`,
    );
  }

  if (appUrl) {
    lines.push(
      `<p style="margin:0 0 24px;"><a href="${appUrl}" style="display:inline-block;background:#E08A3C;color:#fff;`
        + `text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">${escapeHtml(copy.cta)}</a></p>`,
    );
  }

  // 止め方が書いていないメールは迷惑メール扱いされやすいので、必ず出す
  lines.push(
    `<hr style="border:none;border-top:1px solid #EADFD2;margin:28px 0 16px;" />`,
    `<p style="font-size:13px;color:#9C8871;margin:0;">${escapeHtml(copy.footer)} `
      + `<a href="${SITE_URL}/profile.html" style="color:#9C8871;">${escapeHtml(copy.settings)}</a></p>`,
  );

  const htmlContent =
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`
    + `background:#FAF4EC;padding:24px;">`
    + `<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">`
    + lines.join("")
    + `</div></div>`;

  const textParts = [copy.heading, "", copy.intro, "", appName];
  if (requestText) textParts.push(copy.forRequest + ": " + requestText);
  if (appUrl) textParts.push("", appUrl);
  textParts.push("", copy.footer, SITE_URL + "/profile.html");

  return { htmlContent, textContent: textParts.join("\n") };
}

async function sendWithBrevo(to: string, subject: string, htmlContent: string, textContent: string) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": Deno.env.get("BREVO_API_KEY")!,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: Deno.env.get("BREVO_SENDER_EMAIL")!,
        name: Deno.env.get("BREVO_SENDER_NAME") ?? "CobbleWorks",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    // 失敗の中身(認証エラーなのか、宛先が不正なのか)が分からないと直せない
    throw new Error(`brevo ${response.status}: ${(await response.text()).slice(0, 200)}`);
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

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const oldestAllowed = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, mini_apps(name, url), requests(problem)")
      .eq("type", "app_built")
      .is("emailed_at", null)
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

    // 受信者ごとの設定(オンオフ・言語)をまとめて1回で引く
    const userIds = Array.from(new Set(pending.map((row: any) => row.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, locale, email_notifications")
      .in("id", userIds);

    const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    // 送信済みにする行はまとめて1回で更新する(1件ずつUPDATEすると往復が増えるため)
    const doneIds: string[] = [];

    for (const row of pending as any[]) {
      const profile = profileById.get(row.user_id);

      // メール通知をオフにしている人。Inboxには残るので、送信済み扱いにして次から見ない
      if (profile && profile.email_notifications === false) {
        doneIds.push(row.id);
        skipped++;
        continue;
      }

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      const email = userData?.user?.email;
      if (userError || !email) {
        // 退会済みなど、宛先が取れない相手にはもう送りようがない
        doneIds.push(row.id);
        skipped++;
        continue;
      }

      const copy = COPY[profile?.locale as string] ?? COPY.en;
      const appName = row.mini_apps?.name ?? "";
      const appUrl = safeAppUrl(row.mini_apps?.url);
      const requestText = row.requests?.problem ?? "";
      const { htmlContent, textContent } = buildEmail(copy, appName, appUrl, requestText);

      try {
        await sendWithBrevo(email, copy.subject, htmlContent, textContent);
        doneIds.push(row.id);
        sent++;
      } catch (sendError) {
        // emailed_at は空のままにして、次のcronで再試行させる
        // (MAX_AGE_DAYSを過ぎれば自然に対象から外れる)
        errors.push(String(sendError));
      }
    }

    if (doneIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .in("id", doneIds);
      if (updateError) {
        // ここで失敗すると同じメールをもう一度送ってしまうので、必ず記録に残す
        console.error("failed to stamp emailed_at:", updateError.message);
        errors.push("stamp_failed: " + updateError.message);
      }
    }

    return json({ sent, skipped, total: pending.length, errors });
  } catch (error) {
    console.error(error);
    return json({ error: String(error) }, 500);
  }
});
