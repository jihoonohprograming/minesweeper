create or replace function public.spend_coins(p_amount bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_coins bigint;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'invalid amount';
  end if;

  select coins
    into current_coins
  from public.wallets
  where user_id = uid
  for update;

  if current_coins is null then
    raise exception 'wallet not found';
  end if;

  if current_coins < p_amount then
    raise exception 'insufficient coins';
  end if;

  update public.wallets
  set coins = coins - p_amount
  where user_id = uid;

  return current_coins - p_amount;
end;
$$;

revoke all on function public.spend_coins(bigint) from public;
grant execute on function public.spend_coins(bigint) to authenticated;
