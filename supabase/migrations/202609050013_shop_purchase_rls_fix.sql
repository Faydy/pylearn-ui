-- Repairs the secure Shop write path for projects where the function owner does
-- not bypass RLS. This migration is safe after 202609050012 has been executed.

create or replace function public.buy_avatar(p_avatar_id bigint)
returns table (
  avatar_id bigint,
  avatar_seed text,
  coin_balance integer,
  total_coins_earned integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_avatar public.avatar_catalog%rowtype;
  v_total_xp bigint;
  v_coin_balance integer;
  v_total_coins integer;
  v_level integer;
begin
  if v_user_id is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  select *
  into v_avatar
  from public.avatar_catalog
  where id = p_avatar_id
    and is_active;

  if not found then
    raise exception 'Avatarul nu este disponibil.';
  end if;

  if v_avatar.is_starter then
    raise exception 'Avatarul starter este disponibil gratuit.';
  end if;

  select
    coalesce(total_xp, 0),
    coalesce(coin_balance, 0),
    coalesce(total_coins_earned, 0)
  into v_total_xp, v_coin_balance, v_total_coins
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profilul tău nu a fost găsit.';
  end if;

  v_level := floor(greatest(v_total_xp, 0)::numeric / 100)::integer;
  if v_level < v_avatar.required_level then
    raise exception 'Nu ai încă nivelul necesar.';
  end if;

  if exists (
    select 1
    from public.user_avatars ua
    where ua.user_id = v_user_id
      and ua.avatar_id = v_avatar.id
  ) then
    raise exception 'Deții deja acest avatar.';
  end if;

  if v_coin_balance < v_avatar.price_coins then
    raise exception 'Nu ai suficiente monede.';
  end if;

  perform set_config('app.pylearn_economy_change', 'on', true);
  perform set_config('app.pylearn_economy_purchase', 'on', true);

  insert into public.user_avatars (user_id, avatar_id)
  values (v_user_id, v_avatar.id);

  update public.profiles
  set coin_balance = coin_balance - v_avatar.price_coins
  where id = v_user_id
  returning coin_balance, total_coins_earned
  into v_coin_balance, v_total_coins;

  if v_avatar.price_coins > 0 then
    insert into public.coin_transactions (user_id, amount, transaction_type, reason, reference_id)
    values (v_user_id, -v_avatar.price_coins, 'spent', 'avatar_purchase', v_avatar.id);
  end if;

  return query
  select v_avatar.id, v_avatar.seed::text, v_coin_balance, v_total_coins;
end;
$$;

drop policy if exists user_avatars_insert_secure_purchase on public.user_avatars;
create policy user_avatars_insert_secure_purchase
on public.user_avatars
for insert
to authenticated
with check (
  user_id = auth.uid()
  and current_setting('app.pylearn_economy_purchase', true) = 'on'
);

drop policy if exists coin_transactions_insert_secure_purchase on public.coin_transactions;
create policy coin_transactions_insert_secure_purchase
on public.coin_transactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and current_setting('app.pylearn_economy_purchase', true) = 'on'
);

revoke all on function public.buy_avatar(bigint) from public;
grant execute on function public.buy_avatar(bigint) to authenticated;

grant insert on table public.user_avatars to authenticated;
grant insert on table public.coin_transactions to authenticated;
grant usage on sequence public.coin_transactions_id_seq to authenticated;

notify pgrst, 'reload schema';
