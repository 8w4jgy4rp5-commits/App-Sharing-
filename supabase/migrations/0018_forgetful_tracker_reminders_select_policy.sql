-- upsert(INSERT ... ON CONFLICT DO UPDATE)は、競合対象の既存行を確認するために
-- 内部的にSELECTの可視性を必要とする。0016でreminders/subscriptionsのSELECTポリシーを
-- あえて作らなかった(vt_finnhub_keysと同じ「書き込み専用」にする意図)結果、
-- upsert自体が"new row violates row-level security policy"で失敗していた。
-- reminders/subscriptionsの中身は持ち物の名前・時刻とプッシュ購読情報のみで、
-- パスワード等の機微情報を含まないため、anonへの読み取り許可を追加してupsertを通す。

create policy "Anon can read reminders (needed for upsert conflict checks)"
  on public.forgetful_tracker_reminders for select
  to anon
  using (true);

create policy "Anon can read subscriptions (needed for upsert conflict checks)"
  on public.forgetful_tracker_subscriptions for select
  to anon
  using (true);
