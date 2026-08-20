-- Family Schedule: 予定/やることの「編集(Save changes)」でも、追加と同じく
-- 他の家族にWeb Push通知を送る。
--
-- これまで notify_family_item_added() は INSERT (Addボタン) からしか
-- 呼ばれていなかった。ここでは同じ関数に UPDATE (Save changesボタン) 用の
-- トリガーを追加し、関数側では TG_OP を見て action ('added' / 'updated') を
-- payloadに含めて渡す。family-schedule-push Edge Function側もこの action を
-- 見て通知文言を変える(このマイグレーションと合わせてEdge Functionの再デプロイが必要)。
--
-- 実行前に、下の2箇所を実際の値に置き換えてください(0023と同じ手順):
--   <YOUR_PROJECT_REF>      → Supabase Project Settings → General の Reference ID
--   <YOUR_SERVICE_ROLE_KEY> → Project Settings → API の service_role key

create or replace function public.notify_family_item_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/family-schedule-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'group_id', new.group_id,
      'item_type', new.item_type,
      'title', new.title,
      'item_date', new.item_date,
      'created_by', new.created_by,
      'created_by_nickname', new.created_by_nickname,
      'action', case when TG_OP = 'UPDATE' then 'updated' else 'added' end
    )
  );
  return new;
end;
$$;

create trigger family_items_notify_on_update
  after update on public.family_items
  for each row
  execute function public.notify_family_item_added();
