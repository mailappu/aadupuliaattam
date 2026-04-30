-- Fix function search_path
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Replace the permissive update policy with one that requires the requester
-- to identify themselves via the `x-player-id` request header and to be
-- either the host, the current guest, or claiming an empty guest slot.
drop policy if exists "rooms updatable by anyone" on public.rooms;

create policy "rooms updatable by participants"
  on public.rooms for update
  using (
    coalesce(current_setting('request.headers', true)::json->>'x-player-id','') in (host_id, coalesce(guest_id,''))
    or guest_id is null
  )
  with check (
    coalesce(current_setting('request.headers', true)::json->>'x-player-id','') in (host_id, coalesce(guest_id,''))
    or guest_id is null
  );

-- Also tighten insert: client must declare itself as host
drop policy if exists "rooms insertable by anyone" on public.rooms;
create policy "rooms insertable when declaring host"
  on public.rooms for insert
  with check (
    coalesce(current_setting('request.headers', true)::json->>'x-player-id','') = host_id
  );