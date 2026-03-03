-- Account tables and custom design support

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  preferred_language text default 'de',
  marketing_opt_in boolean not null default false,
  notifications_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.custom_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  image_url text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_settings_user_id on public.settings (user_id);
create index if not exists idx_custom_designs_user_id on public.custom_designs (user_id);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

create trigger set_custom_designs_updated_at
before update on public.custom_designs
for each row execute function public.set_updated_at();

insert into public.users (id)
select distinct user_id from public.orders
where user_id is not null
and not exists (
  select 1 from public.users u where u.id = public.orders.user_id
);

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders
  add constraint orders_user_id_fkey foreign key (user_id) references public.users (id) on delete set null;

alter table public.orders
  add column if not exists custom_design_id uuid references public.custom_designs (id);

create index if not exists idx_orders_custom_design_id on public.orders (custom_design_id);



