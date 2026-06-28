-- =============================================================================
-- Personal Journal — schema for Supabase (SQL editor or CLI migrations)
-- Simple version: public read using anon key, writes ONLY via Edge Function.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Diary entries (main content — one row per journal post)
--    category = display label (must match journal_categories.label for filters)
--    mood     = slug (must match journal_moods.slug)
-- -----------------------------------------------------------------------------
create table if not exists diary_entries (
  id              uuid primary key default gen_random_uuid(),
  title           text,
  body            text,
  date            date not null,
  category        text,
  location        text,
  mood            text,
  cover_image_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table diary_entries is 'Journal posts; readable by anon, writes via Edge Function only.';
comment on column diary_entries.category is 'Human-readable category label; sync with journal_categories.label.';
comment on column diary_entries.mood is 'Mood slug; sync with journal_moods.slug.';
comment on column diary_entries.cover_image_url is 'Public or signed URL from Storage bucket covers.';

create index if not exists diary_entries_date_idx on diary_entries (date desc);
create index if not exists diary_entries_category_idx on diary_entries (category);
create index if not exists diary_entries_mood_idx on diary_entries (mood);

-- -----------------------------------------------------------------------------
-- 2. Categories — edit in Supabase → Table Editor → journal_categories
-- -----------------------------------------------------------------------------
create table if not exists journal_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table journal_categories is 'Dropdown options for Compose / Archive; inactive rows hidden in app.';
comment on column journal_categories.label is 'Saved into diary_entries.category when user picks this option.';
comment on column journal_categories.slug is 'Stable id for URLs/exports; label can change independently.';

create index if not exists journal_categories_active_sort_idx
  on journal_categories (is_active, sort_order, label);

-- -----------------------------------------------------------------------------
-- 3. Moods — edit emoji, labels, order in journal_moods
-- -----------------------------------------------------------------------------
create table if not exists journal_moods (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  emoji       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table journal_moods is 'Mood picker options; diary_entries.mood stores slug.';
comment on column journal_moods.emoji is 'Optional; shown in selects and entry cards.';

create index if not exists journal_moods_active_sort_idx
  on journal_moods (is_active, sort_order, label);

-- -----------------------------------------------------------------------------
-- 4. Triggers — updated_at on diary_entries
-- -----------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on diary_entries;
create trigger set_updated_at
  before update on diary_entries
  for each row execute function update_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security — public read, no direct writes from browser
-- -----------------------------------------------------------------------------
alter table diary_entries enable row level security;
alter table journal_categories enable row level security;
alter table journal_moods enable row level security;

drop policy if exists "Public read" on diary_entries;
drop policy if exists "Public read entries" on diary_entries;
create policy "Public read entries"
  on diary_entries for select
  using (true);

drop policy if exists "Public read categories" on journal_categories;
create policy "Public read categories"
  on journal_categories for select using (true);

drop policy if exists "Public read moods" on journal_moods;
create policy "Public read moods"
  on journal_moods for select using (true);

-- -----------------------------------------------------------------------------
-- 6. Seed data (safe to re-run)
-- -----------------------------------------------------------------------------
insert into journal_categories (slug, label, sort_order) values
  ('travel', 'Travel', 10),
  ('life-update', 'Life update', 20),
  ('food', 'Food', 30),
  ('milestone', 'Milestone', 40),
  ('reflection', 'Reflection', 50),
  ('daily', 'Daily', 60)
on conflict (slug) do nothing;

insert into journal_moods (slug, label, emoji, sort_order) values
  ('happy', 'Happy', '😊', 10),
  ('grateful', 'Grateful', '🙏', 20),
  ('excited', 'Excited', '✨', 30),
  ('reflective', 'Reflective', '💭', 40),
  ('calm', 'Calm', '🌿', 50),
  ('sad', 'Sad', '💙', 60)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- 7. Storage — create bucket "covers" in Dashboard → Storage (not SQL)
--    Use public bucket or signed URLs depending on your privacy needs.
-- -----------------------------------------------------------------------------

-- Writes: do NOT add insert/update/delete policies for anon.
-- All writes should go through the Edge Function `diary-mutate` using the service role key.
