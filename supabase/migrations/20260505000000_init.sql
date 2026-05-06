-- Migration: 20260505000000_init
-- Creates bookmarks, tags, and bookmark_tags tables with RLS policies.

-- ─────────────────────────────────────────────
-- 1. bookmarks
-- ─────────────────────────────────────────────
create table if not exists public.bookmarks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  url          text not null,
  title        text,
  description  text,
  thumbnail_url text,
  favicon_url  text,
  site_name    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at auto-update trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row execute procedure public.set_updated_at();

-- Indexes
create index if not exists bookmarks_user_id_created_at_idx
  on public.bookmarks (user_id, created_at desc);

-- Enable RLS
alter table public.bookmarks enable row level security;

-- Policies
create policy "bookmarks: select own"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "bookmarks: insert own"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "bookmarks: update own"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bookmarks: delete own"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 2. tags
-- ─────────────────────────────────────────────
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Indexes
create index if not exists tags_user_id_name_idx
  on public.tags (user_id, name);

-- Enable RLS
alter table public.tags enable row level security;

-- Policies
create policy "tags: select own"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "tags: insert own"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "tags: update own"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags: delete own"
  on public.tags for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. bookmark_tags (junction)
-- ─────────────────────────────────────────────
create table if not exists public.bookmark_tags (
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (bookmark_id, tag_id)
);

-- Indexes
create index if not exists bookmark_tags_bookmark_id_idx
  on public.bookmark_tags (bookmark_id);

create index if not exists bookmark_tags_tag_id_idx
  on public.bookmark_tags (tag_id);

-- Enable RLS
alter table public.bookmark_tags enable row level security;

-- Policies — ownership verified via bookmarks.user_id
create policy "bookmark_tags: select own"
  on public.bookmark_tags for select
  using (
    exists (
      select 1 from public.bookmarks b
      where b.id = bookmark_tags.bookmark_id
        and b.user_id = auth.uid()
    )
  );

create policy "bookmark_tags: insert own"
  on public.bookmark_tags for insert
  with check (
    exists (
      select 1 from public.bookmarks b
      where b.id = bookmark_tags.bookmark_id
        and b.user_id = auth.uid()
    )
  );

create policy "bookmark_tags: delete own"
  on public.bookmark_tags for delete
  using (
    exists (
      select 1 from public.bookmarks b
      where b.id = bookmark_tags.bookmark_id
        and b.user_id = auth.uid()
    )
  );
