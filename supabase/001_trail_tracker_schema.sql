-- Trail Tracker schema
-- Design goals:
--   * Troop leader = real Supabase Auth user (email/password, Google, or Apple)
--   * Scout = "display_name" only (first name + last initial, e.g. "Jordan M.")
--     No email, phone, DOB, or address is ever stored for a scout.
--   * Scout logs in with a private access code (no password), which links
--     their device session (a Supabase anonymous auth user) to their scout row.
--   * Leader can view/edit every scout in their troop. Scout can only see
--     and edit their own record once claimed.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Code generation helper: avoids visually ambiguous characters
-- (0/O, 1/I/L) since scouts type these by hand.
-- ---------------------------------------------------------------------
create or replace function generate_access_code() returns text as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0,O,1,I,L
  result text := '';
  i int;
begin
  for i in 1..9 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    if i = 3 or i = 6 then
      result := result || '-';
    end if;
  end loop;
  return result;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- Rate limiting for claim attempts (no email/2FA fallback exists, so
-- brute-forcing the code is the main attack surface — lock it down hard).
-- Keyed by the caller's own (anonymous) auth uid, since a scout only ever
-- needs to submit one code — not a scout_id lookup first.
-- ---------------------------------------------------------------------
create table claim_attempts (
  caller_uid uuid not null,
  attempted_at timestamptz default now()
);

create index claim_attempts_caller_time on claim_attempts (caller_uid, attempted_at);

-- ---------------------------------------------------------------------
-- Troops
-- ---------------------------------------------------------------------
create table troops (
  id uuid primary key default gen_random_uuid(),
  leader_user_id uuid references auth.users not null,
  name text not null,               -- e.g. "Troop 452"
  created_at timestamptz default now()
);

alter table troops enable row level security;

create policy "Leaders manage their own troop"
  on troops for all
  using (auth.uid() = leader_user_id)
  with check (auth.uid() = leader_user_id);

-- ---------------------------------------------------------------------
-- Scouts
-- ---------------------------------------------------------------------
create table scouts (
  id uuid primary key default gen_random_uuid(),
  troop_id uuid references troops(id) on delete cascade not null,
  display_name text not null,        -- "Jordan M." style — first name + last initial only
  access_code_hash text not null,    -- hashed, never store the plaintext code
  auth_uid uuid unique,              -- set once the scout claims their code; null = unclaimed
  rank text not null default 'scout',
  interests text[] default '{}',
  created_at timestamptz default now()
);

alter table scouts enable row level security;

-- Leader can do anything to scouts in their own troop
create policy "Leaders manage scouts in their troop"
  on scouts for all
  using (troop_id in (select id from troops where leader_user_id = auth.uid()))
  with check (troop_id in (select id from troops where leader_user_id = auth.uid()));

-- A claimed scout can see and update their own row (but not troop_id,
-- access_code_hash, or auth_uid — enforced by the trigger below)
create policy "Scouts view their own record"
  on scouts for select
  using (auth.uid() = auth_uid);

create policy "Scouts update their own record"
  on scouts for update
  using (auth.uid() = auth_uid)
  with check (auth.uid() = auth_uid);

-- Lock down which columns a scout (non-leader) can change on their own row
create or replace function prevent_scout_privilege_escalation()
returns trigger as $$
begin
  if auth.uid() = old.auth_uid then
    if new.troop_id <> old.troop_id
       or new.access_code_hash <> old.access_code_hash
       or new.auth_uid is distinct from old.auth_uid then
      raise exception 'Scouts cannot modify troop, code, or claim status';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger scouts_guard_columns
  before update on scouts
  for each row execute function prevent_scout_privilege_escalation();

-- ---------------------------------------------------------------------
-- Scout badge progress
-- ---------------------------------------------------------------------
create table scout_badges (
  scout_id uuid references scouts(id) on delete cascade,
  badge_id text not null,            -- matches BADGES[].id in trail-tracker-data.json
  status text not null default 'none' check (status in ('none','want','progress','done')),
  counselor text,
  notes text,
  date_started date,
  date_done date,
  primary key (scout_id, badge_id)
);

alter table scout_badges enable row level security;

create policy "Leaders manage badges for scouts in their troop"
  on scout_badges for all
  using (scout_id in (
    select s.id from scouts s
    join troops t on t.id = s.troop_id
    where t.leader_user_id = auth.uid()
  ))
  with check (scout_id in (
    select s.id from scouts s
    join troops t on t.id = s.troop_id
    where t.leader_user_id = auth.uid()
  ));

create policy "Scouts manage their own badges"
  on scout_badges for all
  using (scout_id in (select id from scouts where auth_uid = auth.uid()))
  with check (scout_id in (select id from scouts where auth_uid = auth.uid()));

-- ---------------------------------------------------------------------
-- Access code helpers
-- ---------------------------------------------------------------------

-- Call this (as the leader) when creating a scout. Returns the plaintext
-- code ONCE — only the hash is persisted. Hand the plaintext to the scout
-- out of band (printed slip, spoken aloud, etc.) and never log it.
create or replace function create_scout(
  p_troop_id uuid,
  p_display_name text
) returns table (scout_id uuid, access_code text) as $$
declare
  v_code text;
  v_scout_id uuid;
begin
  if not exists (select 1 from troops where id = p_troop_id and leader_user_id = auth.uid()) then
    raise exception 'Not authorized for this troop';
  end if;

  v_code := generate_access_code();

  insert into scouts (troop_id, display_name, access_code_hash)
  values (p_troop_id, p_display_name, crypt(v_code, gen_salt('bf')))
  returning id into v_scout_id;

  return query select v_scout_id, v_code;
end;
$$ language plpgsql security definer;

-- Call this from the scout's device after they sign in anonymously
-- (supabase.auth.signInAnonymously()) and enter their code. Looks the
-- scout up by code alone — no scout_id needed, so a scout only ever has
-- to type one thing. Links the anonymous auth_uid to that scout row,
-- unless it's already claimed by someone else, so a code can't be
-- hijacked once claimed. Returns the matched scout_id.
create or replace function claim_scout(
  p_code text
) returns uuid as $$
declare
  v_scout record;
  v_recent_attempts int;
  v_normalized text := upper(trim(p_code));
begin
  -- Rate limit: max 5 attempts per caller per 10 minutes.
  select count(*) into v_recent_attempts
  from claim_attempts
  where caller_uid = auth.uid() and attempted_at > now() - interval '10 minutes';

  if v_recent_attempts >= 5 then
    raise exception 'Too many attempts. Please wait 10 minutes and try again, or ask your troop leader to reset your code.';
  end if;

  insert into claim_attempts (caller_uid) values (auth.uid());

  select id, auth_uid into v_scout
  from scouts
  where (auth_uid is null or auth_uid = auth.uid())
    and crypt(v_normalized, access_code_hash) = access_code_hash
  limit 1;

  if v_scout.id is null then
    raise exception 'Incorrect code';
  end if;

  update scouts set auth_uid = auth.uid() where id = v_scout.id;
  -- Successful claim clears this caller's throttle history.
  delete from claim_attempts where caller_uid = auth.uid();
  return v_scout.id;
end;
$$ language plpgsql security definer;

-- Leader-only: lost/compromised code recovery. Unlinks the old device and
-- issues a brand new code — same idea as a password reset, without email.
create or replace function reset_scout_code(
  p_scout_id uuid
) returns text as $$
declare
  v_code text;
  v_troop_id uuid;
begin
  select troop_id into v_troop_id from scouts where id = p_scout_id;

  if not exists (select 1 from troops where id = v_troop_id and leader_user_id = auth.uid()) then
    raise exception 'Not authorized for this scout';
  end if;

  v_code := generate_access_code();

  update scouts
  set access_code_hash = crypt(v_code, gen_salt('bf')),
      auth_uid = null
  where id = p_scout_id;

  return v_code;
end;
$$ language plpgsql security definer;

-- claim_attempts needs RLS too (only touched via the security-definer
-- functions above, but enable it defensively so it's never directly queryable)
alter table claim_attempts enable row level security;
