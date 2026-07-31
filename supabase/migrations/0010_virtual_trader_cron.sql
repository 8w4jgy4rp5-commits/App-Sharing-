-- Virtual Trader: ブラウザを開いていなくても価格を記録し続けるための定期ジョブ。
-- pg_cronで1分おきにvt-finnhub-proxy Edge Functionのcron_refreshアクションを叩く。
--
-- 実行前に、以下の2箇所を実際の値に置き換えてから実行してください:
--   <YOUR_PROJECT_REF>        : SupabaseプロジェクトURLの一部 (xyumhzecqhpzzzzylbwn)
--   <YOUR_SERVICE_ROLE_KEY>   : Project Settings > API > service_role key

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'vt-refresh-prices',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/vt-finnhub-proxy',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'cron_refresh')
  );
  $$
);
