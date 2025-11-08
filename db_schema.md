create table public.products (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  name_uk text not null,
  name_de text not null,
  description_uk text null,
  description_de text null,
  category text not null,
  ingredients_uk text[] null,
  ingredients_de text[] null,
  allergens_uk text[] null,
  allergens_de text[] null,
  available_designs jsonb null default '[]'::jsonb,
  image_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  images_urls text[] null,
  constraint products_pkey primary key (id),
  constraint products_slug_key unique (slug),
  constraint products_category_check check (
    (
      category = any (array['torten'::text, 'desserts'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_products_category on public.products using btree (category) TABLESPACE pg_default;

create index IF not exists idx_products_slug on public.products using btree (slug) TABLESPACE pg_default;

create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();