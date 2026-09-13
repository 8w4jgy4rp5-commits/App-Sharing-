-- お知らせメール: 5分おきに notification-email Edge Function を叩き、
-- 未送信のお知らせ(notifications.emailed_at が null)があればメールを送らせる。
--
-- 1分おきではなく5分おきにしている理由:
--   アプリを作ってから知らせるまで数分遅れても困らない一方、
--   メールは送りすぎ・二重送信の被害が大きいので、間隔は広めに取る。
--
-- 実行前に、以下の2箇所を実際の値に置き換えてから実行してください:
--   <YOUR_PROJECT_REF>        : SupabaseプロジェクトURLの一部 (xyumhzecqhpzzzzylbwn)
--   <YOUR_SERVICE_ROLE_KEY>   : Project Settings > API > service_role key

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'cobbleworks-send-notification-emails',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notification-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
