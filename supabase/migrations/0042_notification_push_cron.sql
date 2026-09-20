-- 押し通知: 1分おきに notification-push Edge Function を叩き、
-- 未配信のお知らせ(notifications.pushed_at が null)があれば通知を送らせる。
--
-- 実行前に、以下の2箇所を実際の値に置き換えてから実行してください:
--   <YOUR_PROJECT_REF>        : SupabaseプロジェクトURLの一部 (xyumhzecqhpzzzzylbwn)
--   <YOUR_SERVICE_ROLE_KEY>   : Project Settings > API > service_role key

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'cobbleworks-send-notification-push',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notification-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
