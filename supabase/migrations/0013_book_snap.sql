-- Book Snap: 図書館の本などを撮影して読書ノートとして残すミニアプリ用テーブル。
--
-- 設計メモ:
-- ・写真はlocalStorageに収まらないため、Virtual Trader同様Supabaseに全データを置く
--   (このアプリもプラットフォームの「基本local-only」ルールの意図的な例外)。
-- ・AIによる文字起こしは行わず、ページのnoteはユーザー本人が撮影後に書く自由コメント。
--   サーバー側の計算ロジックが無いため、vt_place_order()のようなsecurity definer関数は不要で、
--   クライアントから直接insert/update/deleteしてよい(RLSでuser_id=auth.uid()のみに制限)。
-- ・タグを削除すると、そのタグを最後の1個として失った本はタグ経由の入口から見えなくなる
--   (本自体やページは消えない)。book_snap_booksの直接削除だけがページを道連れに消す。

create table if not exists public.book_snap_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.book_snap_tags enable row level security;

create policy "Users can view their own book_snap tags"
  on public.book_snap_tags for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own book_snap tags"
  on public.book_snap_tags for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own book_snap tags"
  on public.book_snap_tags for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own book_snap tags"
  on public.book_snap_tags for delete
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.book_snap_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  author text not null default '',
  created_at timestamptz not null default now()
);

alter table public.book_snap_books enable row level security;

create policy "Users can view their own book_snap books"
  on public.book_snap_books for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own book_snap books"
  on public.book_snap_books for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own book_snap books"
  on public.book_snap_books for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own book_snap books"
  on public.book_snap_books for delete
  to authenticated
  using (user_id = auth.uid());

-- 本とタグの多対多。user_idを持たせてRLSをjoin無しで書けるようにする(所有者は常にbookと一致)。
create table if not exists public.book_snap_book_tags (
  book_id uuid not null references public.book_snap_books(id) on delete cascade,
  tag_id uuid not null references public.book_snap_tags(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (book_id, tag_id)
);

alter table public.book_snap_book_tags enable row level security;

create policy "Users can view their own book_snap book_tags"
  on public.book_snap_book_tags for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own book_snap book_tags"
  on public.book_snap_book_tags for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own book_snap book_tags"
  on public.book_snap_book_tags for delete
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.book_snap_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.book_snap_books(id) on delete cascade,
  image_path text not null,
  note text not null default '',
  page_order integer not null,
  created_at timestamptz not null default now()
);

alter table public.book_snap_pages enable row level security;

create policy "Users can view their own book_snap pages"
  on public.book_snap_pages for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own book_snap pages"
  on public.book_snap_pages for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own book_snap pages"
  on public.book_snap_pages for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own book_snap pages"
  on public.book_snap_pages for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists book_snap_pages_book_order_idx
  on public.book_snap_pages (book_id, page_order);

-- 撮影画像用Storageバケット。読書ノートという性質上、avatarsと違い非公開(public=false)にし、
-- 本人のフォルダ({user_id}/...)だけ読み書きできるようにする。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-snap-pages', 'book-snap-pages', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users can view their own book_snap page images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'book-snap-pages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own book_snap page images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-snap-pages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own book_snap page images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-snap-pages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
