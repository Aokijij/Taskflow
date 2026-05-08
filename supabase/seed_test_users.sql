-- Seed de pruebas para TaskFlow
-- Credenciales para los 3 usuarios:
-- Password comun: DemoTask123!
-- 1) ana.demo@taskflow.dev
-- 2) bruno.demo@taskflow.dev
-- 3) carla.demo@taskflow.dev

do $$
declare
  v_now timestamptz := timezone('utc', now());
  u1 uuid := '11111111-1111-4111-8111-111111111111';
  u2 uuid := '22222222-2222-4222-8222-222222222222';
  u3 uuid := '33333333-3333-4333-8333-333333333333';
  g1 uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  g2 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
begin
  delete from public.task_email_notifications
  where recipient_email in ('ana.demo@taskflow.dev', 'bruno.demo@taskflow.dev', 'carla.demo@taskflow.dev');

  delete from public.google_calendar_task_events
  where user_id in (u1, u2, u3);

  delete from public.task_activity
  where actor_id in (u1, u2, u3) or group_id in (g1, g2);

  delete from public.tasks
  where user_id in (u1, u2, u3) or group_id in (g1, g2);

  delete from public.task_categories
  where user_id in (u1, u2, u3) or group_id in (g1, g2);

  delete from public.group_members
  where group_id in (g1, g2)
     or email in ('ana.demo@taskflow.dev', 'bruno.demo@taskflow.dev', 'carla.demo@taskflow.dev');

  delete from public.task_groups
  where id in (g1, g2);

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      u1,
      'authenticated',
      'authenticated',
      'ana.demo@taskflow.dev',
      crypt('DemoTask123!', gen_salt('bf')),
      v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Ana","last_name":"Velasquez","phone":"3001112233"}'::jsonb,
      v_now,
      v_now
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      u2,
      'authenticated',
      'authenticated',
      'bruno.demo@taskflow.dev',
      crypt('DemoTask123!', gen_salt('bf')),
      v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Bruno","last_name":"Herrera","phone":"3002223344"}'::jsonb,
      v_now,
      v_now
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      u3,
      'authenticated',
      'authenticated',
      'carla.demo@taskflow.dev',
      crypt('DemoTask123!', gen_salt('bf')),
      v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Carla","last_name":"Mendoza","phone":"3003334455"}'::jsonb,
      v_now,
      v_now
    )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = excluded.updated_at;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      gen_random_uuid(),
      u1,
      jsonb_build_object('sub', u1::text, 'email', 'ana.demo@taskflow.dev'),
      'email',
      'ana.demo@taskflow.dev',
      v_now,
      v_now,
      v_now
    ),
    (
      gen_random_uuid(),
      u2,
      jsonb_build_object('sub', u2::text, 'email', 'bruno.demo@taskflow.dev'),
      'email',
      'bruno.demo@taskflow.dev',
      v_now,
      v_now,
      v_now
    ),
    (
      gen_random_uuid(),
      u3,
      jsonb_build_object('sub', u3::text, 'email', 'carla.demo@taskflow.dev'),
      'email',
      'carla.demo@taskflow.dev',
      v_now,
      v_now,
      v_now
    )
  on conflict do nothing;

  insert into public.profiles (
    id,
    email,
    name,
    last_name,
    phone,
    avatar_url,
    browser_notifications_enabled,
    created_at,
    updated_at
  )
  values
    (u1, 'ana.demo@taskflow.dev', 'Ana', 'Velasquez', '3001112233', null, false, v_now, v_now),
    (u2, 'bruno.demo@taskflow.dev', 'Bruno', 'Herrera', '3002223344', null, false, v_now, v_now),
    (u3, 'carla.demo@taskflow.dev', 'Carla', 'Mendoza', '3003334455', null, false, v_now, v_now)
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    updated_at = excluded.updated_at;

  insert into public.task_groups (id, owner_id, name, code, color, created_at, updated_at)
  values
    (g1, u1, 'Producto Q2', 'PROQ26', '#2563eb', v_now, v_now),
    (g2, u2, 'Contenido Mayo', 'CONT26', '#14b8a6', v_now, v_now)
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    name = excluded.name,
    code = excluded.code,
    color = excluded.color,
    updated_at = excluded.updated_at;

  insert into public.group_members (
    id,
    group_id,
    user_id,
    email,
    role,
    status,
    invited_by,
    created_at
  )
  values
    (gen_random_uuid(), g1, u1, 'ana.demo@taskflow.dev', 'owner', 'active', u1, v_now),
    (gen_random_uuid(), g1, u2, 'bruno.demo@taskflow.dev', 'member', 'active', u1, v_now),
    (gen_random_uuid(), g1, u3, 'carla.demo@taskflow.dev', 'member', 'active', u1, v_now),
    (gen_random_uuid(), g2, u2, 'bruno.demo@taskflow.dev', 'owner', 'active', u2, v_now),
    (gen_random_uuid(), g2, u3, 'carla.demo@taskflow.dev', 'member', 'active', u2, v_now),
    (gen_random_uuid(), g2, u1, 'ana.demo@taskflow.dev', 'member', 'invited', u2, v_now)
  on conflict (group_id, email) do update
  set
    user_id = excluded.user_id,
    role = excluded.role,
    status = excluded.status,
    invited_by = excluded.invited_by;

  insert into public.task_categories (id, user_id, scope, group_id, name, active, created_at, updated_at)
  select
    gen_random_uuid(),
    seeded.user_id,
    'personal',
    null,
    seeded.category,
    true,
    v_now,
    v_now
  from (
    values
      (u1, 'Trabajo'),
      (u1, 'Estudio'),
      (u1, 'Salud'),
      (u1, 'Hogar'),
      (u1, 'Finanzas'),
      (u2, 'Trabajo'),
      (u2, 'Estudio'),
      (u2, 'Salud'),
      (u2, 'Hogar'),
      (u2, 'Finanzas'),
      (u3, 'Trabajo'),
      (u3, 'Estudio'),
      (u3, 'Salud'),
      (u3, 'Hogar'),
      (u3, 'Finanzas')
  ) as seeded(user_id, category);

  insert into public.task_categories (id, user_id, scope, group_id, name, active, created_at, updated_at)
  select
    gen_random_uuid(),
    group_seed.owner_id,
    'group',
    group_seed.group_id,
    group_seed.category,
    true,
    v_now,
    v_now
  from (
    values
      (u1, g1, 'Planificacion'),
      (u1, g1, 'Backend'),
      (u1, g1, 'Diseno'),
      (u1, g1, 'QA'),
      (u1, g1, 'Lanzamiento'),
      (u2, g2, 'Contenido'),
      (u2, g2, 'Redes'),
      (u2, g2, 'Revision'),
      (u2, g2, 'Campanas'),
      (u2, g2, 'Reuniones')
  ) as group_seed(owner_id, group_id, category);

  insert into public.tasks (
    id,
    user_id,
    scope,
    group_id,
    created_by,
    updated_by,
    assigned_to,
    name,
    description,
    category,
    priority,
    due_date,
    completed,
    created_at,
    updated_at
  )
  with users as (
    select *
    from (
      values
        (u1, 'ana.demo@taskflow.dev', 'Ana', 1),
        (u2, 'bruno.demo@taskflow.dev', 'Bruno', 2),
        (u3, 'carla.demo@taskflow.dev', 'Carla', 3)
    ) as u(user_id, email, first_name, offset_days)
  ),
  categories as (
    select *
    from (
      values
        (1, 'Trabajo'),
        (2, 'Estudio'),
        (3, 'Salud'),
        (4, 'Hogar'),
        (5, 'Finanzas')
    ) as c(category_order, category_name)
  ),
  seeded as (
    select
      u.user_id,
      u.email,
      u.first_name,
      u.offset_days,
      c.category_name,
      ((c.category_order - 1) * 6 + g.slot) as seq
    from users u
    cross join categories c
    cross join lateral (
      select generate_series(1, 6) as slot
    ) as g
  )
  select
    gen_random_uuid(),
    seeded.user_id,
    'personal',
    null,
    seeded.user_id,
    seeded.user_id,
    null,
    format(
      '%s - %s %s',
      seeded.category_name,
      case
        when seeded.seq <= 10 then 'Cerrado'
        when seeded.seq <= 20 then 'Revision'
        else 'Proximo'
      end,
      seeded.seq
    ),
    format(
      'Tarea demo de %s para %s. Sirve para probar listado, filtros, calendario y detalle.',
      seeded.first_name,
      seeded.category_name
    ),
    seeded.category_name,
    case
      when seeded.seq % 3 = 1 then 'Alta'
      when seeded.seq % 3 = 2 then 'Media'
      else 'Baja'
    end,
    case
      when seeded.seq <= 10 then date '2026-05-01' + ((seeded.seq + seeded.offset_days - 1) % 7)
      when seeded.seq <= 20 then date '2026-05-01' + ((seeded.seq + seeded.offset_days - 11) % 6)
      else date '2026-05-08' + ((seeded.seq + seeded.offset_days * 2 - 21) % 22)
    end,
    seeded.seq <= 10,
    v_now - make_interval(days => 40 - seeded.seq),
    v_now - make_interval(days => greatest(1, 16 - seeded.seq))
  from seeded;

  insert into public.tasks (
    id,
    user_id,
    scope,
    group_id,
    created_by,
    updated_by,
    assigned_to,
    name,
    description,
    category,
    priority,
    due_date,
    completed,
    created_at,
    updated_at
  )
  values
    (gen_random_uuid(), u1, 'group', g1, u1, u1, u2, 'Definir roadmap', 'Alinear entregas del mes.', 'Planificacion', 'Alta', '2026-05-09', false, v_now, v_now),
    (gen_random_uuid(), u2, 'group', g1, u2, u2, u3, 'Montar API base', 'Preparar endpoints del modulo principal.', 'Backend', 'Alta', '2026-05-12', false, v_now, v_now),
    (gen_random_uuid(), u3, 'group', g1, u3, u3, u3, 'Validar prototipo', 'Revisar navegacion y estados visuales.', 'Diseno', 'Media', '2026-05-05', false, v_now, v_now),
    (gen_random_uuid(), u1, 'group', g1, u1, u1, u2, 'Suite de pruebas', 'Cubrir casos criticos antes del cierre.', 'QA', 'Media', '2026-05-18', false, v_now, v_now),
    (gen_random_uuid(), u2, 'group', g1, u2, u2, u1, 'Checklist de release', 'Consolidar pendientes para liberar.', 'Lanzamiento', 'Alta', '2026-05-26', false, v_now, v_now),
    (gen_random_uuid(), u3, 'group', g1, u3, u3, u1, 'Documentar decisiones', 'Registrar acuerdos del grupo.', 'Planificacion', 'Baja', '2026-05-03', true, v_now, v_now),
    (gen_random_uuid(), u2, 'group', g2, u2, u2, u3, 'Calendario editorial', 'Organizar publicaciones de mayo.', 'Contenido', 'Alta', '2026-05-08', false, v_now, v_now),
    (gen_random_uuid(), u3, 'group', g2, u3, u3, u3, 'Disenar piezas sociales', 'Preparar artes para la semana.', 'Redes', 'Media', '2026-05-14', false, v_now, v_now),
    (gen_random_uuid(), u2, 'group', g2, u2, u2, u2, 'Revisar copies', 'Validar tono y llamados a la accion.', 'Revision', 'Baja', '2026-05-06', false, v_now, v_now),
    (gen_random_uuid(), u3, 'group', g2, u3, u3, u2, 'Activar campana piloto', 'Lanzar prueba controlada.', 'Campanas', 'Alta', '2026-05-21', false, v_now, v_now),
    (gen_random_uuid(), u2, 'group', g2, u2, u2, u3, 'Retro semanal', 'Hacer seguimiento a resultados.', 'Reuniones', 'Baja', '2026-05-28', false, v_now, v_now),
    (gen_random_uuid(), u3, 'group', g2, u3, u3, u3, 'Ajustar backlog', 'Reordenar ideas segun prioridad.', 'Contenido', 'Media', '2026-05-02', true, v_now, v_now);

  insert into public.task_activity (
    id,
    task_id,
    group_id,
    actor_id,
    actor_email,
    action,
    details,
    created_at
  )
  select
    gen_random_uuid(),
    task.id,
    task.group_id,
    task.created_by,
    profile.email,
    'created',
    'Registro inicial de datos demo',
    task.created_at
  from public.tasks task
  join public.profiles profile on profile.id = task.created_by
  where task.group_id in (g1, g2);
end $$;
