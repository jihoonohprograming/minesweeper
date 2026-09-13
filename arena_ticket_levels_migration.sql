create table if not exists public.arena_ticket_levels (
  user_id uuid primary key references auth.users(id) on delete cascade,
  l1 integer not null default 0 check (l1 >= 0),
  l2 integer not null default 0 check (l2 >= 0),
  l3 integer not null default 0 check (l3 >= 0),
  l4 integer not null default 0 check (l4 >= 0),
  l5 integer not null default 0 check (l5 >= 0),
  l6 integer not null default 0 check (l6 >= 0),
  l7 integer not null default 0 check (l7 >= 0),
  l8 integer not null default 0 check (l8 >= 0),
  updated_at timestamptz not null default now()
);

alter table public.arena_ticket_levels enable row level security;

drop policy if exists "arena ticket levels readable" on public.arena_ticket_levels;
create policy "arena ticket levels readable"
on public.arena_ticket_levels for select
to authenticated
using (true);

drop policy if exists "arena ticket levels own insert" on public.arena_ticket_levels;
create policy "arena ticket levels own insert"
on public.arena_ticket_levels for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "arena ticket levels own update" on public.arena_ticket_levels;
create policy "arena ticket levels own update"
on public.arena_ticket_levels for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.record_arena_ticket_level(p_level integer)
returns public.arena_ticket_levels
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result_row public.arena_ticket_levels;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_level < 1 or p_level > 8 then raise exception 'invalid level'; end if;

  insert into public.arena_ticket_levels(user_id)
  values(uid)
  on conflict (user_id) do nothing;

  update public.arena_ticket_levels
  set
    l1 = l1 + case when p_level=1 then 1 else 0 end,
    l2 = l2 + case when p_level=2 then 1 else 0 end,
    l3 = l3 + case when p_level=3 then 1 else 0 end,
    l4 = l4 + case when p_level=4 then 1 else 0 end,
    l5 = l5 + case when p_level=5 then 1 else 0 end,
    l6 = l6 + case when p_level=6 then 1 else 0 end,
    l7 = l7 + case when p_level=7 then 1 else 0 end,
    l8 = l8 + case when p_level=8 then 1 else 0 end,
    updated_at = now()
  where user_id = uid
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.record_arena_ticket_level(integer) to authenticated;
