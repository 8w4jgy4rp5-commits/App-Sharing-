-- 押し通知（Web Push）の土台。
--
-- 解決したい問題:
--   0038のInboxは「サイトに来た人」にしか届かない。リクエストを出した人の多くは
--   アプリが出来たあと戻ってこないので、本人に伝わっていない。
--   メールも検討したが、独自ドメインが要るうえ迷惑メール扱いされやすく、
--   「1つのプラットフォームで完結する」というCobbleWorksの方針とも合わなかった。
--
-- 設計メモ:
--   * 通知の記録場所は notifications テーブル1本のまま。ここに pushed_at を足して、
--     「この通知を押し通知で配ったか」だけを覚える（emailed_at の隣に並ぶ）。
--   * オン/オフ用の列はあえて作らない。購読行があれば送る、無ければ送らない。
--     設定列と購読行の二重管理にすると、必ずどちらかとズレる。
--   * このファイルだけで完結する（0039のメール用マイグレーションは実行不要）。

-- ===========================
-- 押し通知の宛先
-- ===========================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- ブラウザが発行する宛先URL。端末×ブラウザごとに1つで、世界で重複しない
  endpoint text not null unique,
  -- 暗号鍵を含む購読情報まるごと。web-pushライブラリにそのまま渡す
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 送信時は「この人の宛先を全部」という引き方しかしない
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- 自分の購読状態を確認する（「この端末はオンになっている」の表示用）
create policy "Users can read their own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- 通知をオフにする
create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- insert / update のポリシーはわざと作らない。登録は下の関数だけを通す。


-- 購読を登録する。
--
-- 直接insertにしていない理由:
--   同じ端末を別のアカウントで使い始めると、endpointは同じまま持ち主だけが変わる。
--   RLSは「他人の行」を触らせないので、古い行が残って通知が前の持ち主に飛び続ける。
--   ここで一度消してから入れ直すことで、endpointの持ち主を必ず1人に保つ。
create or replace function public.save_push_subscription(
  p_endpoint text,
  p_subscription jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.push_subscriptions where endpoint = p_endpoint;

  insert into public.push_subscriptions (user_id, endpoint, subscription)
  values (auth.uid(), p_endpoint, p_subscription);
end;
$$;

revoke all on function public.save_push_subscription(text, jsonb) from public;
grant execute on function public.save_push_subscription(text, jsonb) to authenticated;


-- ===========================
-- 通知側に「配ったか」を持たせる
-- ===========================

alter table public.notifications
  add column if not exists pushed_at timestamptz;

-- 未配信は常にごく少数なので部分索引にする
create index if not exists notifications_unpushed_idx
  on public.notifications (created_at)
  where pushed_at is null;

-- この機能を入れる前から溜まっていた通知は配信済み扱いにする。
-- そうしないと、cronを動かした瞬間に過去分がまとめて鳴る
update public.notifications
  set pushed_at = now()
  where pushed_at is null;


-- ===========================
-- 通知を何語で書くか
-- ===========================

-- 言語は今まで端末のlocalStorageにしか無く、サーバー側からは分からなかった。
-- 通知の文章はサーバーで組み立てるので、ここに保存先を用意する。nullなら英語。
alter table public.profiles
  add column if not exists locale text;

-- 想定外の値が入ると文面の組み立てが壊れるので、対応5言語だけに絞る
alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check
  check (locale is null or locale in ('en', 'ja', 'es', 'zh', 'hi'));
