-- Phase 1.5: account creation trigger + personal notes on recipes

-- Auto-create a profiles row when someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Personal notes a user keeps on a cached recipe (substitutions, timing tweaks, etc).
create table recipe_notes (
  id               bigserial primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  notes            text not null default '',
  updated_at       timestamptz not null default now(),
  unique (user_id, cached_recipe_id)
);

alter table recipe_notes enable row level security;
create policy "Users manage own notes" on recipe_notes for all using (auth.uid() = user_id);

-- Favourites are personal too - remove the public-read policy added in 0001
-- (it combined with "Users manage own saves" to make everyone's saves world-readable).
drop policy "Public read access" on recipe_saves;
