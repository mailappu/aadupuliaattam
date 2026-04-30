create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id text not null,
  guest_id text,
  host_side text not null check (host_side in ('goat','tiger')),
  state jsonb not null,
  status text not null default 'waiting' check (status in ('waiting','playing','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_code_idx on public.rooms(code);

alter table public.rooms enable row level security;

-- Anyone (anon) can read rooms — needed to look up by code and to subscribe to realtime updates.
create policy "rooms readable by anyone"
  on public.rooms for select
  using (true);

-- Anyone can create a room.
create policy "rooms insertable by anyone"
  on public.rooms for insert
  with check (true);

-- Anyone can update a room — game logic in the client validates whose turn it is.
-- (No auth in this casual app; both players need to be able to update state.)
create policy "rooms updatable by anyone"
  on public.rooms for update
  using (true)
  with check (true);

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_touch_updated_at
  before update on public.rooms
  for each row execute function public.touch_updated_at();

-- Enable realtime
alter table public.rooms replica identity full;
alter publication supabase_realtime add table public.rooms;