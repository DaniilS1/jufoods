-- Create tables to separate torten designs and flavours
create table if not exists public.torten_designs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_de text not null,
  name_uk text not null,
  description_de text,
  description_uk text,
  category text not null default 'torten' check (category = 'torten'),
  sub_category text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.torten_flavours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_de text not null,
  name_uk text not null,
  description_de text,
  description_uk text,
  ingredients_de text[] default '{}',
  ingredients_uk text[] default '{}',
  allergens_de text[] default '{}',
  allergens_uk text[] default '{}',
  nutrition jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- migrate existing torten products into torten_designs
insert into public.torten_designs (id, slug, name_uk, name_de, description_uk, description_de, category, sub_category, image_url, created_at, updated_at)
select
  p.id,
  p.slug,
  p.name_uk,
  p.name_de,
  p.description_uk,
  p.description_de,
  p.category,
  p.sub_category,
  p.image_url,
  coalesce(p.created_at, now()),
  coalesce(p.updated_at, now())
from public.products as p
where p.category = 'torten'
on conflict (id) do nothing;

-- remove torten entries from the legacy products table to avoid duplicates
delete from public.products where category = 'torten';

