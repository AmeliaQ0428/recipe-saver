-- Phase 3b: per-step ingredient list (replaces per-step ingredient images)

alter table cached_recipe_steps
  add column step_ingredients jsonb not null default '[]'::jsonb;
