-- Repair the one-time onboarding claim after 202609050014. The function-level
-- settings are visible to both the guarded profiles trigger and user_avatars
-- RLS for the full RPC invocation.

-- A profile with no equipped catalog avatar and no ownership record did not
-- receive a usable initial avatar. Such incomplete profiles may claim once.
update public.profiles as p
set initial_avatar_claimed_at = null
where p.initial_avatar_claimed_at is not null
  and p.avatar is null
  and not exists (
    select 1
    from public.user_avatars as ua
    where ua.user_id = p.id
  );

create or replace function public.claim_initial_avatar(p_avatar_id bigint)
returns table (avatar_id bigint, avatar_seed text)
language plpgsql
security definer
set search_path = public
set app.pylearn_initial_avatar_claim = 'on'
set app.pylearn_avatar_change = 'on'
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

  -- Serialize concurrent requests. The second call sees the persisted claim.
  select p.initial_avatar_claimed_at, p.username, p.role
  into v_claimed_at, v_username, v_role
  from public.profiles as p
  where p.id = v_user_id
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

  select ac.*
  into v_avatar
  from public.avatar_catalog as ac
  where ac.id = p_avatar_id
    and ac.is_active
    and ac.is_onboarding_choice;

  if not found then
    raise exception 'Avatarul selectat nu este disponibil pentru alegerea inițială.';
  end if;

  insert into public.user_avatars (user_id, avatar_id)
  values (v_user_id, v_avatar.id)
  on conflict (user_id, avatar_id) do nothing;

  update public.profiles as p
  set
    avatar = v_avatar.seed,
    initial_avatar_claimed_at = now()
  where p.id = v_user_id;

  return query
  select v_avatar.id, v_avatar.seed::text;
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
grant execute on function public.claim_initial_avatar(bigint) to authenticated;

notify pgrst, 'reload schema';
