-- Phase 3: cached recipe ingredients (for ingredient lists + servings scaling)

create table cached_recipe_ingredients (
  id               bigserial primary key,
  cached_recipe_id bigint not null references cached_recipes(id) on delete cascade,
  sort_order       integer not null,
  name             text not null,
  amount           numeric,
  unit             text,
  original         text not null,
  unique (cached_recipe_id, sort_order)
);

alter table cached_recipe_ingredients enable row level security;
create policy "Public read access" on cached_recipe_ingredients for select using (true);
