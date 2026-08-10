-- Family Schedule: 予定(Schedule)に終了時刻も指定できるようにする。
-- item_timeを開始時刻として扱い、この列は任意の終了時刻。

alter table public.family_items
  add column if not exists item_end_time text;
