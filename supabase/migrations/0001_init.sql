-- Phase 1: recipe cache + taxonomy
-- Phase 2/3 tables are created here too (additive-only schema going forward).

-- ===================== Taxonomy =====================

create table cuisines (
  id    smallserial primary key,
  slug  text unique not null,
  label text not null
);

insert into cuisines (slug, label) values
  ('italian', 'Italian'),
  ('mexican', 'Mexican'),
  ('chinese', 'Chinese'),
  ('japanese', 'Japanese'),
  ('thai', 'Thai'),
  ('vietnamese', 'Vietnamese'),
  ('indian', 'Indian'),
  ('french', 'French'),
  ('greek', 'Greek'),
  ('mediterranean', 'Mediterranean'),
  ('american', 'American'),
  ('korean', 'Korean'),
  ('spanish', 'Spanish'),
  ('middle eastern', 'Middle Eastern');

create table meal_types (
  id    smallserial primary key,
  slug  text unique not null,
  label text not null,
  spoonacular_type text not null
);

insert into meal_types (slug, label, spoonacular_type) values
  ('breakfast', 'Breakfast', 'breakfast'),
  ('lunch', 'Lunch', 'main course'),
  ('dinner', 'Dinner', 'main course'),
  ('dessert', 'Dessert', 'dessert'),
  ('snack', 'Snack', 'snack');

-- ===================== Phase 1: cached recipes =====================

create table cached_recipes (
  id                bigserial primary key,
  spoonacular_id    integer unique not null,
  title             text not null,
  image_url         text,
  source_url        text,
  ready_in_minutes  integer,
  servings          integer,
  spoonacular_score numeric,
  aggregate_likes   integer,
  cuisines          text[] not null default '{}',
  meal_types_raw    text[] not null default '{}',
  summary           text,
  raw_json          jsonb,
  last_fetched_at   timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index cached_recipes_score_idx on cached_recipes (spoonacular_score desc);
create index cached_recipes_cuisines_idx on cached_recipes using gin (cuisines);
create index cached_recipes_meal_types_idx on cached_recipes using gin (meal_types_raw);

create table cached_recipe_steps (
  id               bigserial primary key,
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  step_number      integer not null,
  description      text not null,
  image_url        text,
  ingredient_images text[] not null default '{}',
  created_at       timestamptz not null default now(),
  unique (cached_recipe_id, step_number)
);

create table cached_recipe_cuisines (
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  cuisine_id       smallint not null references cuisines(id),
  primary key (cached_recipe_id, cuisine_id)
);

create table cached_recipe_meal_types (
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  meal_type_id     smallint not null references meal_types(id),
  primary key (cached_recipe_id, meal_type_id)
);

create table trending_recipes (
  id               bigserial primary key,
  meal_type_id     smallint not null references meal_types(id),
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  rank             integer not null,
  source           text not null default 'spoonacular_popular',
  refreshed_at     timestamptz not null default now(),
  unique (meal_type_id, rank, source)
);

create index trending_recipes_meal_type_idx on trending_recipes (meal_type_id, rank);

-- ===================== Phase 2: auth + user recipes =====================

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table user_recipes (
  id               bigserial primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  title            text not null,
  description      text,
  cover_image_url  text,
  cuisine_id       smallint references cuisines(id),
  meal_type_id     smallint references meal_types(id),
  ready_in_minutes integer,
  servings         integer,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index user_recipes_published_idx on user_recipes (is_published, created_at desc);

create table user_recipe_steps (
  id             bigserial primary key,
  user_recipe_id bigint not null references user_recipes(id) on delete cascade,
  step_number    integer not null,
  description    text not null,
  image_url      text,
  unique (user_recipe_id, step_number)
);

-- ===================== Phase 3: social features =====================

create table recipe_likes (
  id               bigserial primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  cached_recipe_id bigint references cached_recipes(id) on delete cascade,
  user_recipe_id   bigint references user_recipes(id) on delete cascade,
  created_at       timestamptz not null default now(),
  constraint recipe_likes_one_target check (
    (cached_recipe_id is not null)::int + (user_recipe_id is not null)::int = 1
  ),
  unique (user_id, cached_recipe_id, user_recipe_id)
);

create table recipe_comments (
  id               bigserial primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  cached_recipe_id bigint references cached_recipes(id) on delete cascade,
  user_recipe_id   bigint references user_recipes(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint recipe_comments_one_target check (
    (cached_recipe_id is not null)::int + (user_recipe_id is not null)::int = 1
  )
);

create table recipe_saves (
  id               bigserial primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  cached_recipe_id bigint references cached_recipes(id) on delete cascade,
  user_recipe_id   bigint references user_recipes(id) on delete cascade,
  created_at       timestamptz not null default now(),
  constraint recipe_saves_one_target check (
    (cached_recipe_id is not null)::int + (user_recipe_id is not null)::int = 1
  ),
  unique (user_id, cached_recipe_id, user_recipe_id)
);

create table search_activity_log (
  id               bigserial primary key,
  event_type       text not null check (event_type in ('search', 'view', 'save')),
  query_text       text,
  cuisine_id       smallint references cuisines(id),
  meal_type_id     smallint references meal_types(id),
  cached_recipe_id bigint references cached_recipes(id),
  user_recipe_id   bigint references user_recipes(id),
  user_id          uuid references profiles(id),
  created_at       timestamptz not null default now()
);

create index search_activity_log_created_idx on search_activity_log (created_at);
create index search_activity_log_event_idx on search_activity_log (event_type, created_at);

-- ===================== Row Level Security =====================

-- Phase 1 tables: public read, writes only via service-role (cron job bypasses RLS)
alter table cuisines enable row level security;
alter table meal_types enable row level security;
alter table cached_recipes enable row level security;
alter table cached_recipe_steps enable row level security;
alter table cached_recipe_cuisines enable row level security;
alter table cached_recipe_meal_types enable row level security;
alter table trending_recipes enable row level security;

create policy "Public read access" on cuisines for select using (true);
create policy "Public read access" on meal_types for select using (true);
create policy "Public read access" on cached_recipes for select using (true);
create policy "Public read access" on cached_recipe_steps for select using (true);
create policy "Public read access" on cached_recipe_cuisines for select using (true);
create policy "Public read access" on cached_recipe_meal_types for select using (true);
create policy "Public read access" on trending_recipes for select using (true);

-- Anonymous view-event logging for Phase 1 (writes restricted to inserts only)
alter table search_activity_log enable row level security;
create policy "Anyone can log activity" on search_activity_log for insert with check (true);
create policy "Public read access" on search_activity_log for select using (true);

-- Phase 2/3 tables: owner-write, public-read-published (enabled now, used once those features ship)
alter table profiles enable row level security;
alter table user_recipes enable row level security;
alter table user_recipe_steps enable row level security;
alter table recipe_likes enable row level security;
alter table recipe_comments enable row level security;
alter table recipe_saves enable row level security;

create policy "Public read access" on profiles for select using (true);
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);

create policy "Public read published recipes" on user_recipes for select using (is_published = true or auth.uid() = user_id);
create policy "Owners manage own recipes" on user_recipes for all using (auth.uid() = user_id);

create policy "Public read steps of published recipes" on user_recipe_steps for select using (
  exists (
    select 1 from user_recipes r
    where r.id = user_recipe_steps.user_recipe_id
      and (r.is_published = true or r.user_id = auth.uid())
  )
);
create policy "Owners manage own recipe steps" on user_recipe_steps for all using (
  exists (
    select 1 from user_recipes r
    where r.id = user_recipe_steps.user_recipe_id and r.user_id = auth.uid()
  )
);

create policy "Public read access" on recipe_likes for select using (true);
create policy "Users manage own likes" on recipe_likes for all using (auth.uid() = user_id);

create policy "Public read access" on recipe_comments for select using (true);
create policy "Users manage own comments" on recipe_comments for all using (auth.uid() = user_id);

create policy "Public read access" on recipe_saves for select using (true);
create policy "Users manage own saves" on recipe_saves for all using (auth.uid() = user_id);
