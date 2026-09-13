-- お知らせ機能のマイグレーションが、どこまで実行済みかを調べる。
--
-- なぜ必要か:
--   Supabase の SQL Editor は「どのマイグレーションを流したか」を記録しない。
--   supabase/migrations/ のファイルはただのファイルなので、DB側に履歴が無い。
--   そのため前提のファイルを飛ばして実行すると
--     ERROR: 42P01: relation "public.notifications" does not exist
--   のようなエラーになる。
--
-- 使い方:
--   Supabase ダッシュボードの SQL Editor にこの全文を貼って実行する。
--   「× 未実行」の行があれば、その migration のファイルを番号順に流す。
--   このSQLは読むだけで、何も変更しない。

-- cron.job は pg_cron が入っていないと存在せず、SQL本文に直接書くと
-- 実行前の構文解析でエラーになる。動的SQLで包んで、無い場合はfalseを返す。
-- pg_temp は今つないでいるセッション限りなので、DBには何も残らない。
create or replace function pg_temp.cron_job_exists(job_name text)
returns boolean
language plpgsql
as $$
declare
  n integer;
begin
  if to_regclass('cron.job') is null then
    return false;
  end if;
  execute 'select count(*) from cron.job where jobname = $1' into n using job_name;
  return n > 0;
end;
$$;

with expected(migration, kind, obj, parent) as (
  values
    ('0038_notifications',           'table',    'notifications',                         null),
    ('0038_notifications',           'column',   'read_at',                               'notifications'),
    ('0038_notifications',           'function', 'notify_request_owner_on_app',           null),
    ('0038_notifications',           'trigger',  'mini_apps_notify_request_owner_insert', 'mini_apps'),
    ('0038_notifications',           'trigger',  'mini_apps_notify_request_owner_update', 'mini_apps'),
    ('0039_notification_emails',     'column',   'emailed_at',                            'notifications'),
    ('0039_notification_emails',     'column',   'email_notifications',                   'profiles'),
    ('0039_notification_emails',     'column',   'locale',                                'profiles'),
    ('0040_notification_email_cron', 'cron',     'cobbleworks-send-notification-emails',  null)
),
found as (
  select
    e.*,
    case e.kind
      when 'table' then exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = e.obj
      )
      when 'column' then exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = e.parent and column_name = e.obj
      )
      when 'function' then exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = e.obj
      )
      when 'trigger' then exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = e.parent
          and t.tgname = e.obj and not t.tgisinternal
      )
      when 'cron' then pg_temp.cron_job_exists(e.obj)
    end as ok
  from expected e
)
select
  migration                                            as "マイグレーション",
  case when ok then '○ 実行済み' else '× 未実行' end   as "状態",
  kind                                                 as "種類",
  coalesce(parent || '.', '') || obj                   as "対象"
from found
order by migration, kind, obj;
