-- Forgetful Tracker: 1分おきにforgetful-tracker-push Edge Functionを叩き、
-- 時刻の来たreminderがあればプッシュ通知を送らせるcronジョブ。
--
-- 実行前に、以下の2箇所を実際の値に置き換えてから実行してください:
--   <YOUR_PROJECT_REF>        : SupabaseプロジェクトURLの一部 (xyumhzecqhpzzzzylbwn)
--   <YOUR_SERVICE_ROLE_KEY>   : Project Settings > API > service_role key

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'forgetful-tracker-send-due-push',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/forgetful-tracker-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
