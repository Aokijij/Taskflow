create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null default 'personal' check (scope in ('personal', 'group')),
  group_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  name text not null,
  description text not null default '',
  category text not null default 'Home',
  priority text not null default 'Baja',
  due_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.task_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.task_groups (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'requested')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (group_id, email)
);

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  group_id uuid references public.task_groups (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text not null default '',
  action text not null,
  details text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks add column if not exists scope text not null default 'personal';
alter table public.tasks add column if not exists group_id uuid references public.task_groups (id) on delete cascade;
alter table public.tasks add column if not exists created_by uuid references public.profiles (id) on delete set null;
alter table public.tasks add column if not exists updated_by uuid references public.profiles (id) on delete set null;
alter table public.tasks add column if not exists assigned_to uuid references public.profiles (id) on delete set null;
alter table public.tasks drop constraint if exists tasks_group_id_fkey;
alter table public.tasks add constraint tasks_group_id_fkey
foreign key (group_id) references public.task_groups (id) on delete cascade;
alter table public.tasks drop constraint if exists tasks_scope_check;
alter table public.tasks add constraint tasks_scope_check check (scope in ('personal', 'group'));
alter table public.tasks drop constraint if exists tasks_group_scope_check;
alter table public.tasks add constraint tasks_group_scope_check check (
  (scope = 'personal' and group_id is null) or
  (scope = 'group' and group_id is not null)
);
alter table public.group_members drop constraint if exists group_members_status_check;
alter table public.group_members add constraint group_members_status_check check (status in ('active', 'invited', 'requested'));

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_group_id_idx on public.tasks (group_id);
create index if not exists tasks_scope_idx on public.tasks (scope);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_completed_idx on public.tasks (completed);
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists group_members_email_idx on public.group_members (email);
create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists task_activity_task_id_idx on public.task_activity (task_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists task_groups_set_updated_at on public.task_groups;
create trigger task_groups_set_updated_at
before update on public.task_groups
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, last_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    null
  )
  on conflict (id) do update
  set
    name = excluded.name,
    last_name = excluded.last_name,
    phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.join_group_by_code(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  current_email text;
  active_members integer;
begin
  select id
  into target_group_id
  from public.task_groups
  where code = upper(trim(invite_code))
  limit 1;

  if target_group_id is null then
    raise exception 'No se encontro un grupo con ese codigo.';
  end if;

  select email
  into current_email
  from auth.users
  where id = auth.uid();

  if (
    select count(*)
    from public.group_members
    where user_id = auth.uid()
      and status = 'active'
  ) >= 5 then
    raise exception 'Solo puedes estar en maximo 5 grupos.';
  end if;

  select count(*)
  into active_members
  from public.group_members
  where group_id = target_group_id
    and status = 'active';

  if active_members >= 10 then
    raise exception 'El grupo ya tiene el limite de 10 miembros.';
  end if;

  insert into public.group_members (group_id, user_id, email, role, status, invited_by)
  values (target_group_id, auth.uid(), current_email, 'member', 'requested', auth.uid())
  on conflict (group_id, email) do update
  set
    user_id = excluded.user_id,
    status = 'requested',
    role = public.group_members.role;

  return target_group_id;
end;
$$;

create or replace function public.accept_group_request(member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select group_id
  into target_group_id
  from public.group_members
  where id = member_id
    and status = 'requested';

  if target_group_id is null then
    raise exception 'No se encontro una solicitud pendiente.';
  end if;

  if not public.is_group_owner(target_group_id) then
    raise exception 'Solo el propietario puede aceptar solicitudes.';
  end if;

  update public.group_members
  set status = 'active'
  where id = member_id;

  return target_group_id;
end;
$$;

create or replace function public.decline_group_request(member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select group_id
  into target_group_id
  from public.group_members
  where id = member_id
    and status = 'requested';

  if target_group_id is null then
    raise exception 'No se encontro una solicitud pendiente.';
  end if;

  if not public.is_group_owner(target_group_id) then
    raise exception 'Solo el propietario puede rechazar solicitudes.';
  end if;

  delete from public.group_members
  where id = member_id;

  return target_group_id;
end;
$$;

create or replace function public.accept_group_invitation(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  invited_email text;
begin
  select email
  into invited_email
  from auth.users
  where id = auth.uid();

  if (
    select count(*)
    from public.group_members
    where user_id = auth.uid()
      and status = 'active'
  ) >= 5 then
    raise exception 'Solo puedes estar en maximo 5 grupos.';
  end if;

  update public.group_members
  set user_id = auth.uid(), status = 'active'
  where id = invitation_id
    and lower(email) = lower(invited_email)
    and status = 'invited'
  returning group_id into target_group_id;

  if target_group_id is null then
    raise exception 'No se encontro una invitacion pendiente para tu correo.';
  end if;

  return target_group_id;
end;
$$;

create or replace function public.decline_group_invitation(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  invited_email text;
begin
  select email
  into invited_email
  from auth.users
  where id = auth.uid();

  delete from public.group_members
  where id = invitation_id
    and lower(email) = lower(invited_email)
    and status = 'invited'
  returning group_id into target_group_id;

  if target_group_id is null then
    raise exception 'No se encontro una invitacion pendiente para tu correo.';
  end if;

  return target_group_id;
end;
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.status = 'active'
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
      and gm.status = 'active'
  );
$$;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.task_activity enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
on public.tasks
for select
to authenticated
using (
  (scope = 'personal' and auth.uid() = user_id)
  or public.is_group_member(tasks.group_id)
);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
on public.tasks
for insert
to authenticated
with check (
  (scope = 'personal' and auth.uid() = user_id and group_id is null)
  or public.is_group_member(tasks.group_id)
);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
on public.tasks
for update
to authenticated
using (
  (scope = 'personal' and auth.uid() = user_id)
  or public.is_group_member(tasks.group_id)
)
with check (
  (scope = 'personal' and auth.uid() = user_id and group_id is null)
  or public.is_group_member(tasks.group_id)
);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
on public.tasks
for delete
to authenticated
using (
  (scope = 'personal' and auth.uid() = user_id)
  or public.is_group_member(tasks.group_id)
);

drop policy if exists "Users can view groups where members" on public.task_groups;
create policy "Users can view groups where members"
on public.task_groups
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_group_member(task_groups.id)
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = task_groups.id
      and lower(gm.email) = public.current_auth_email()
      and gm.status = 'invited'
  )
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = task_groups.id
      and gm.user_id = auth.uid()
      and gm.status = 'requested'
  )
);

drop policy if exists "Users can create groups" on public.task_groups;
create policy "Users can create groups"
on public.task_groups
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Group owners can update groups" on public.task_groups;
create policy "Group owners can update groups"
on public.task_groups
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Group owners can delete groups" on public.task_groups;
create policy "Group owners can delete groups"
on public.task_groups
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can view group members" on public.group_members;
create policy "Users can view group members"
on public.group_members
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    lower(email) = public.current_auth_email()
    and status = 'invited'
  )
  or (
    user_id = auth.uid()
    and status = 'requested'
  )
  or public.is_group_member(group_members.group_id)
);

drop policy if exists "Members can invite group members" on public.group_members;
create policy "Members can invite group members"
on public.group_members
for insert
to authenticated
with check (
  invited_by = auth.uid()
  or user_id = auth.uid()
  or public.is_group_member(group_members.group_id)
);

drop policy if exists "Members can update own membership" on public.group_members;
create policy "Members can update own membership"
on public.group_members
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_owner(group_members.group_id)
)
with check (
  user_id = auth.uid()
  or public.is_group_owner(group_members.group_id)
);

drop policy if exists "Group owners can remove members" on public.group_members;
create policy "Group owners can remove members"
on public.group_members
for delete
to authenticated
using (
  public.is_group_owner(group_members.group_id)
  or user_id = auth.uid()
  or (
    lower(email) = public.current_auth_email()
    and status = 'invited'
  )
);

drop policy if exists "Members can view task activity" on public.task_activity;
create policy "Members can view task activity"
on public.task_activity
for select
to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_activity.task_id
      and (
        (t.scope = 'personal' and t.user_id = auth.uid())
        or public.is_group_member(t.group_id)
      )
  )
);

drop policy if exists "Members can create task activity" on public.task_activity;
create policy "Members can create task activity"
on public.task_activity
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.tasks t
    where t.id = task_activity.task_id
      and (
        (t.scope = 'personal' and t.user_id = auth.uid())
        or public.is_group_member(t.group_id)
      )
  )
);
