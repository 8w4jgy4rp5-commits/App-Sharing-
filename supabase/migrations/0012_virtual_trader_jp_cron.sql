-- Virtual Trader JP: ブラウザを開いていなくても価格を記録し続けるための定期ジョブ。
-- pg_cronで1分おきにvtjp-yahoo-proxy Edge Functionのcron_refreshアクションを叩く。
--
-- 実行前に、<YOUR_SERVICE_ROLE_KEY> を実際の値に置き換えてから実行してください:
--   Project Settings > API > service_role key
-- (プロジェクトref xyumhzecqhpzzzzylbwn は埋め込み済み。service_role鍵は秘密情報のため
--  リポジトリには置かず、SQL Editorに貼り付ける時だけ手で差し替えること。)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 立会時間内だけ叩く。米国版は24時間365日1分おきに叩いていたが、東証が閉じている間は
-- 値が動かないので、取得しても同じ終値をティック表に積み増すだけで無駄になる。
-- (cron自体は毎分起動し、開場していない分は即座に何もせず終わる)
select cron.schedule(
  'vtjp-refresh-prices',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://xyumhzecqhpzzzzylbwn.supabase.co/functions/v1/vtjp-yahoo-proxy',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'cron_refresh')
  )
  where public.vtjp_market_is_open();
  $$
);

-- ティックは1銘柄あたり1分1行たまるため、放置すると際限なく増える。
-- チャートはYahooの日足を直接描くようになりティックに依存していないので、
-- 直近7日分だけ残せば足りる。毎日午前3時(UTC)に掃除する。
select cron.schedule(
  'vtjp-prune-price-ticks',
  '0 3 * * *',
  $$
  delete from public.vtjp_price_ticks where ts < now() - interval '7 days';
  $$
);
