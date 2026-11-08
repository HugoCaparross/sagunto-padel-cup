-- ============================================================
-- SAGUNTO PADEL CUP
-- Migracion inicial de base de datos
-- PostgreSQL / Supabase
--
-- IMPORTANTE:
-- - Diseñada para un proyecto nuevo y una base de datos vacía.
-- - No ejecutar si estas tablas, tipos o funciones ya existen.
-- - No contiene contraseñas ni crea cuentas de Auth.
-- - El primer administrador se asigna por separado.
-- ============================================================

begin;

-- ============================================================
-- 1. TIPOS ENUM
-- ============================================================

create type public.app_role as enum (
  'player',
  'admin'
);

create type public.season_status as enum (
  'draft',
  'active',
  'closed',
  'archived'
);

create type public.event_status as enum (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.event_type as enum (
  'regular',
  'master_final'
);

create type public.category_level as enum (
  'first',
  'second',
  'third',
  'fourth_initiation'
);

create type public.subgroup_level as enum (
  'oro',
  'plata',
  'bronce'
);

-- ============================================================
-- 2. FUNCION PARA updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

-- ============================================================
-- 3. PERFILES
-- ============================================================

create table public.profiles (
  id uuid primary key
    references auth.users(id) on delete cascade,

  display_name text,
  avatar_url text,
  bio text,

  is_public boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. ROLES DE USUARIO
-- ============================================================

create table public.user_roles (
  user_id uuid not null
    references auth.users(id) on delete cascade,

  role public.app_role not null default 'player',

  created_at timestamptz not null default now(),

  primary key (user_id, role)
);

create index user_roles_role_idx
  on public.user_roles (role);

-- ============================================================
-- 5. FUNCION SEGURA PARA COMPROBAR ROLES
-- ============================================================

create or replace function public.has_role(
  requested_role public.app_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = (select auth.uid())
      and ur.role = requested_role
  );
$$;

revoke all
on function public.has_role(public.app_role)
from public, anon, authenticated;

grant execute
on function public.has_role(public.app_role)
to authenticated;

-- ============================================================
-- 6. CREACION AUTOMATICA DE PERFIL Y ROL PLAYER
-- No acepta roles enviados en los metadatos de registro.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    nullif(
      trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')),
      ''
    )
  );

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    new.id,
    'player'
  );

  return new;
end;
$$;

revoke all
on function public.handle_new_user()
from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- 7. TEMPORADAS
-- ============================================================

create table public.seasons (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  year integer not null,

  description text,

  status public.season_status not null default 'draft',

  start_date date,
  end_date date,

  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seasons_year_valid
    check (year between 2000 and 2200),

  constraint seasons_dates_valid
    check (
      start_date is null
      or end_date is null
      or start_date <= end_date
    )
);

create trigger seasons_set_updated_at
before update on public.seasons
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. CATEGORIAS OFICIALES
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  level public.category_level not null,

  description text,

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_sort_order_valid
    check (sort_order >= 0)
);

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

insert into public.categories (
  name,
  slug,
  level,
  is_active,
  sort_order
)
values
  ('1.ª Categoría', '1-categoria', 'first', true, 1),
  ('2.ª Categoría', '2-categoria', 'second', true, 2),
  ('3.ª Categoría', '3-categoria', 'third', true, 3),
  ('4.ª Categoría / Iniciación', '4-categoria-iniciacion', 'fourth_initiation', true, 4);

-- ============================================================
-- 9. SUBGRUPOS
-- ============================================================

create table public.subgroups (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  level public.subgroup_level not null,

  description text,

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subgroups_sort_order_valid
    check (sort_order >= 0),

  constraint subgroups_name_level_unique
    unique (name, level)
);

create trigger subgroups_set_updated_at
before update on public.subgroups
for each row
execute function public.set_updated_at();

insert into public.subgroups (
  name,
  level,
  is_active,
  sort_order
)
values
  ('Oro', 'oro', true, 1),
  ('Plata', 'plata', true, 2),
  ('Bronce', 'bronce', true, 3);

-- ============================================================
-- 10. PRUEBAS DEL CIRCUITO
-- Seis pruebas regulares y una Master Final por temporada.
-- ============================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),

  season_id uuid not null
    references public.seasons(id) on delete restrict,

  event_number integer,

  type public.event_type not null default 'regular',

  name text not null,
  slug text not null unique,

  description text,
  location text,

  start_date date,
  end_date date,

  registration_opens_at timestamptz,
  registration_closes_at timestamptz,

  capacity integer,

  status public.event_status not null default 'draft',

  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_number_valid
    check (
      (
        type = 'regular'
        and event_number between 1 and 6
      )
      or
      (
        type = 'master_final'
        and event_number is null
      )
    ),

  constraint events_number_unique
    unique (season_id, event_number),

  constraint events_dates_valid
    check (
      start_date is null
      or end_date is null
      or start_date <= end_date
    ),

  constraint events_registration_dates_valid
    check (
      registration_opens_at is null
      or registration_closes_at is null
      or registration_opens_at <= registration_closes_at
    ),

  constraint events_capacity_valid
    check (capacity is null or capacity > 0)
);

create index events_season_id_idx
  on public.events (season_id);

create index events_status_idx
  on public.events (status);

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

-- ============================================================
-- 11. CATEGORIAS Y SUBGRUPOS DE CADA PRUEBA
-- ============================================================

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id) on delete cascade,

  category_id uuid not null
    references public.categories(id) on delete restrict,

  subgroup_id uuid not null
    references public.subgroups(id) on delete restrict,

  created_at timestamptz not null default now(),

  constraint event_categories_unique
    unique (event_id, category_id, subgroup_id)
);

create index event_categories_event_id_idx
  on public.event_categories (event_id);

create index event_categories_category_id_idx
  on public.event_categories (category_id);

-- ============================================================
-- 12. ACTIVAR ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.seasons enable row level security;
alter table public.categories enable row level security;
alter table public.subgroups enable row level security;
alter table public.events enable row level security;
alter table public.event_categories enable row level security;

-- ============================================================
-- 13. POLITICAS DE PERFILES
-- ============================================================

create policy "Public can view public profiles"
on public.profiles
for select
to anon, authenticated
using (
  is_public = true
);

create policy "Users and admins can view profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.has_role('admin'))
);

create policy "Users update own profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);

create policy "Admins manage profiles"
on public.profiles
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 14. POLITICAS DE ROLES
-- ============================================================

create policy "Users view own roles"
on public.user_roles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.has_role('admin'))
);

create policy "Admins manage roles"
on public.user_roles
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 15. POLITICAS DE TEMPORADAS
-- ============================================================

create policy "Public can view published seasons"
on public.seasons
for select
to anon, authenticated
using (
  status in ('active', 'closed', 'archived')
);

create policy "Admins manage seasons"
on public.seasons
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 16. POLITICAS DE CATEGORIAS
-- ============================================================

create policy "Public can view active categories"
on public.categories
for select
to anon, authenticated
using (
  is_active = true
);

create policy "Admins manage categories"
on public.categories
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 17. POLITICAS DE SUBGRUPOS
-- ============================================================

create policy "Public can view active subgroups"
on public.subgroups
for select
to anon, authenticated
using (
  is_active = true
);

create policy "Admins manage subgroups"
on public.subgroups
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 18. POLITICAS DE PRUEBAS
-- ============================================================

create policy "Public can view published events"
on public.events
for select
to anon, authenticated
using (
  status <> 'draft'
);

create policy "Admins manage events"
on public.events
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 19. POLITICAS DE CATEGORIAS POR PRUEBA
-- ============================================================

create policy "Public can view published event categories"
on public.event_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events as e
    where e.id = event_categories.event_id
      and e.status <> 'draft'
  )
);

create policy "Admins manage event categories"
on public.event_categories
for all
to authenticated
using (
  (select public.has_role('admin'))
)
with check (
  (select public.has_role('admin'))
);

-- ============================================================
-- 20. PERMISOS SQL EXPLICITOS
-- ============================================================

revoke all on
  public.profiles,
  public.user_roles,
  public.seasons,
  public.categories,
  public.subgroups,
  public.events,
  public.event_categories
from anon, authenticated;

grant select on
  public.profiles,
  public.seasons,
  public.categories,
  public.subgroups,
  public.events,
  public.event_categories
to anon, authenticated;

grant select on public.user_roles
to authenticated;

grant update (
  display_name,
  avatar_url,
  bio,
  is_public
)
on public.profiles
to authenticated;

grant insert, update, delete on
  public.seasons,
  public.categories,
  public.subgroups,
  public.events,
  public.event_categories
to authenticated;

grant insert, delete on public.user_roles
to authenticated;

commit;

-- ============================================================
-- ASIGNACION DEL PRIMER ADMINISTRADOR
--
-- NO EJECUTAR ESTE BLOQUE ANTES DE CREAR LA CUENTA.
--
-- 1. En Supabase Dashboard, entra en Authentication -> Users.
-- 2. Crea el usuario con el correo:
--    saguntopadelcup@gmail.com
-- 3. Establece una contraseña nueva, robusta y única.
-- 4. Ejecuta por separado el siguiente SQL en SQL Editor:
--
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role
-- from auth.users
-- where lower(email) = lower('saguntopadelcup@gmail.com')
-- on conflict (user_id, role) do nothing;
--
-- Si no existe la cuenta, no se insertará ningún rol.
-- ============================================================