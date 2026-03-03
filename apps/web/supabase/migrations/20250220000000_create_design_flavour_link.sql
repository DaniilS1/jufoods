create table if not exists public.design_flavour (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.torten_designs(id) on delete cascade,
  flavour_id uuid not null references public.torten_flavours(id) on delete cascade,
  unique (design_id, flavour_id)
);

create index if not exists design_flavour_design_idx on public.design_flavour(design_id);
create index if not exists design_flavour_flavour_idx on public.design_flavour(flavour_id);

