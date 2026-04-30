-- Lock down direct updates; use SECURITY DEFINER RPCs instead.
drop policy if exists "rooms updatable by participants" on public.rooms;

-- Also relax insert again — we will validate via RPC for joins; inserts (host creates room) are fine to allow as long as host_id is set.
drop policy if exists "rooms insertable when declaring host" on public.rooms;
create policy "rooms insertable by anyone"
  on public.rooms for insert
  with check (host_id is not null and length(host_id) between 8 and 128);

-- RPC: join a room by code as guest
create or replace function public.join_room(p_code text, p_player_id text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room_not_found';
  end if;
  if r.host_id = p_player_id then
    return r; -- host opening their own room
  end if;
  if r.guest_id is not null and r.guest_id <> p_player_id then
    raise exception 'room_full';
  end if;
  if r.guest_id is null then
    update public.rooms
      set guest_id = p_player_id,
          status = 'playing'
      where id = r.id
      returning * into r;
  end if;
  return r;
end;
$$;

-- RPC: apply a state update — only host or guest may update
create or replace function public.apply_room_state(p_room_id uuid, p_player_id text, p_state jsonb, p_status text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'room_not_found';
  end if;
  if p_player_id <> r.host_id and (r.guest_id is null or p_player_id <> r.guest_id) then
    raise exception 'not_a_participant';
  end if;
  if p_status not in ('waiting','playing','ended') then
    raise exception 'invalid_status';
  end if;
  update public.rooms
    set state = p_state,
        status = p_status
    where id = p_room_id
    returning * into r;
  return r;
end;
$$;

grant execute on function public.join_room(text, text) to anon, authenticated;
grant execute on function public.apply_room_state(uuid, text, jsonb, text) to anon, authenticated;