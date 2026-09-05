-- A user receives exactly one free onboarding avatar. Every later avatar,
-- including the other onboarding choices, must be owned before it is equipped.

alter table public.profiles
  add column if not exists initial_avatar_claimed_at timestamptz;

alter table public.avatar_catalog
  add column if not exists is_onboarding_choice boolean not null default false;

-- Ada, Nova and Sofia balance Felix, Milo and Theo. Only these six are
-- level-zero onboarding choices. One is claimed for free; the other five are
-- ordinary level-zero Shop products. The six older starter seeds remain Shop
-- products, but unlock at level one so onboarding does not expose twelve
-- level-zero choices.
update public.avatar_catalog
set
  is_starter = false,
  is_onboarding_choice = seed in ('Ada', 'Felix', 'Nova', 'Milo', 'Sofia', 'Theo'),
  price_coins = 5,
  required_level = 0,
  is_free = false,
  rarity = 'common'
where seed in (
  'Ada', 'Felix', 'Nova', 'Milo', 'Sofia', 'Theo'
);

update public.avatar_catalog
set
  is_starter = false,
  is_onboarding_choice = false,
  price_coins = 5,
  required_level = 1,
  is_free = false,
  rarity = 'common'
where seed in (
  'Luna', 'Leo', 'Maya', 'Noah', 'Iris', 'Alex'
);

-- Profiles that predate this migration keep their equipped avatar and cannot
-- use the new one-time claim. No other catalog avatar is granted to them.
insert into public.user_avatars (user_id, avatar_id)
select p.id, ac.id
from public.profiles p
join public.avatar_catalog ac
  on ac.seed = p.avatar
 and ac.is_active
where p.avatar is not null
on conflict (user_id, avatar_id) do nothing;

update public.profiles
set initial_avatar_claimed_at = coalesce(initial_avatar_claimed_at, now())
where initial_avatar_claimed_at is null;

create or replace function public.guard_profile_economy()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_old_xp bigint;
  v_new_xp bigint;
  v_coins_earned integer;
  v_avatar_change_allowed boolean;
  v_economy_change_allowed boolean;
  v_initial_claim_allowed boolean;
begin
  if tg_op = 'INSERT' then
    if auth.role() = 'authenticated' then
      if coalesce(new.total_xp, 0) <> 0
        or coalesce(new.coin_balance, 0) <> 0
        or coalesce(new.total_coins_earned, 0) <> 0 then
        raise exception 'Progresul economic nu poate fi setat din browser.';
      end if;

      if new.avatar is not null then
        raise exception 'Avatarul inițial trebuie ales prin fluxul securizat de creare a profilului.';
      end if;

      if new.initial_avatar_claimed_at is not null then
        raise exception 'Alegerea gratuită a avatarului nu poate fi setată din browser.';
      end if;
    end if;

    new.total_xp := greatest(coalesce(new.total_xp, 0), 0);
    new.coin_balance := greatest(coalesce(new.coin_balance, 0), 0);
    new.total_coins_earned := greatest(coalesce(new.total_coins_earned, 0), 0);
    new.economy_initialized_at := coalesce(new.economy_initialized_at, now());
    return new;
  end if;

  v_avatar_change_allowed := current_setting('app.pylearn_avatar_change', true) = 'on';
  v_economy_change_allowed := current_setting('app.pylearn_economy_change', true) = 'on';
  v_initial_claim_allowed := current_setting('app.pylearn_initial_avatar_claim', true) = 'on';

  if auth.role() = 'authenticated' then
    if new.avatar is distinct from old.avatar and not v_avatar_change_allowed then
      raise exception 'Avatarul trebuie echipat din Shop sau din selectorul aprobat.';
    end if;

    if new.initial_avatar_claimed_at is distinct from old.initial_avatar_claimed_at
      and not v_initial_claim_allowed then
      raise exception 'Alegerea gratuită a avatarului nu poate fi modificată din browser.';
    end if;

    if new.total_xp is distinct from old.total_xp
      or new.coin_balance is distinct from old.coin_balance
      or new.total_coins_earned is distinct from old.total_coins_earned
      or new.economy_initialized_at is distinct from old.economy_initialized_at then
      if not v_economy_change_allowed then
        raise exception 'Progresul economic nu poate fi modificat din browser.';
      end if;
    end if;
  end if;

  v_old_xp := greatest(coalesce(old.total_xp, 0), 0);
  v_new_xp := greatest(coalesce(new.total_xp, 0), 0);
  if v_new_xp < v_old_xp then
    raise exception 'XP-ul nu poate scădea.';
  end if;

  if v_new_xp > v_old_xp then
    v_coins_earned := (
      floor(v_new_xp::numeric / 10)::integer
      - floor(v_old_xp::numeric / 10)::integer
    );
    new.coin_balance := greatest(coalesce(old.coin_balance, 0), 0) + v_coins_earned;
    new.total_coins_earned := greatest(coalesce(old.total_coins_earned, 0), 0) + v_coins_earned;

    if v_coins_earned > 0 then
      insert into public.coin_transactions (user_id, amount, transaction_type, reason)
      values (old.id, v_coins_earned, 'earned', 'xp_reward');
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.claim_initial_avatar(p_avatar_id bigint)
returns table (avatar_id bigint, avatar_seed text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_avatar public.avatar_catalog%rowtype;
  v_claimed_at timestamptz;
  v_username text;
  v_role text;
begin
  if v_user_id is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  -- This row lock makes two simultaneous claims serialize; the second request
  -- observes the first claim and is rejected.
  select initial_avatar_claimed_at, username, role
  into v_claimed_at, v_username, v_role
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profilul tău nu a fost găsit.';
  end if;

  if v_claimed_at is not null then
    raise exception 'Ai folosit deja alegerea gratuită de avatar.';
  end if;

  if coalesce(btrim(v_username), '') = ''
    or coalesce(lower(v_role), '') not in ('elev', 'student', 'profesor', 'teacher') then
    raise exception 'Finalizează datele profilului înainte să alegi avatarul inițial.';
  end if;

  select *
  into v_avatar
  from public.avatar_catalog
  where id = p_avatar_id
    and is_active
    and is_onboarding_choice;

  if not found then
    raise exception 'Avatarul selectat nu este disponibil pentru alegerea inițială.';
  end if;

  perform set_config('app.pylearn_initial_avatar_claim', 'on', true);
  perform set_config('app.pylearn_avatar_change', 'on', true);

  insert into public.user_avatars (user_id, avatar_id)
  values (v_user_id, v_avatar.id)
  on conflict (user_id, avatar_id) do nothing;

  update public.profiles
  set
    avatar = v_avatar.seed,
    initial_avatar_claimed_at = now()
  where id = v_user_id;

  return query select v_avatar.id, v_avatar.seed::text;
end;
$$;

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
  v_initial_avatar_claimed_at timestamptz;
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

  select
    p.initial_avatar_claimed_at,
    coalesce(p.total_xp, 0),
    coalesce(p.coin_balance, 0),
    coalesce(p.total_coins_earned, 0)
  into v_initial_avatar_claimed_at, v_total_xp, v_coin_balance, v_total_coins
  from public.profiles as p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception 'Profilul tău nu a fost găsit.';
  end if;

  if v_initial_avatar_claimed_at is null then
    raise exception 'Alege mai întâi avatarul gratuit din crearea profilului.';
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

  update public.profiles as p
  set coin_balance = p.coin_balance - v_avatar.price_coins
  where p.id = v_user_id
  returning p.coin_balance, p.total_coins_earned
  into v_coin_balance, v_total_coins;

  if v_avatar.price_coins > 0 then
    insert into public.coin_transactions (user_id, amount, transaction_type, reason, reference_id)
    values (v_user_id, -v_avatar.price_coins, 'spent', 'avatar_purchase', v_avatar.id);
  end if;

  return query
  select v_avatar.id, v_avatar.seed::text, v_coin_balance, v_total_coins;
end;
$$;

create or replace function public.set_my_avatar(p_seed text)
returns table (avatar_seed text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_avatar public.avatar_catalog%rowtype;
begin
  if v_user_id is null then
    raise exception 'Trebuie să fii autentificat.';
  end if;

  select *
  into v_avatar
  from public.avatar_catalog
  where seed = p_seed
    and is_active;

  if not found then
    raise exception 'Avatarul nu este disponibil.';
  end if;

  if not exists (
    select 1
    from public.user_avatars ua
    where ua.user_id = v_user_id
      and ua.avatar_id = v_avatar.id
  ) then
    raise exception 'Trebuie să deții acest avatar înainte să îl echipezi.';
  end if;

  perform set_config('app.pylearn_avatar_change', 'on', true);
  update public.profiles
  set avatar = v_avatar.seed
  where id = v_user_id;

  return query select v_avatar.seed::text;
end;
$$;

drop policy if exists user_avatars_insert_secure_purchase on public.user_avatars;
create policy user_avatars_insert_secure_purchase
on public.user_avatars
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    current_setting('app.pylearn_economy_purchase', true) = 'on'
    or current_setting('app.pylearn_initial_avatar_claim', true) = 'on'
  )
);

revoke all on function public.claim_initial_avatar(bigint) from public;
revoke all on function public.buy_avatar(bigint) from public;
revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.claim_initial_avatar(bigint) to authenticated;
grant execute on function public.buy_avatar(bigint) to authenticated;
grant execute on function public.set_my_avatar(text) to authenticated;

grant insert on table public.user_avatars to authenticated;
grant insert on table public.coin_transactions to authenticated;
grant usage on sequence public.coin_transactions_id_seq to authenticated;

notify pgrst, 'reload schema';
