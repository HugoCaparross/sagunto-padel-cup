-- =========================================================
-- PERFILES: datos del jugador y rol (jugador | organizador)
-- =========================================================

create table if not exists public.perfiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nombre                text not null default '',
  rol                   text not null default 'jugador'
                        check (rol in ('jugador', 'organizador')),
  talla_camiseta        text,
  consentimiento_imagen boolean not null default false,
  visibilidad_publica   boolean not null default false,
  created_at            timestamptz not null default now()
);

-- =========================================================
-- Función auxiliar: ¿el usuario actual es organizador?
-- SECURITY DEFINER evita la recursión infinita en las políticas
-- de la propia tabla perfiles.
-- =========================================================

create or replace function public.es_organizador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles
    where id = (select auth.uid())
      and rol = 'organizador'
  );
$$;

-- =========================================================
-- Trigger: crear el perfil automáticamente al registrarse
-- =========================================================

create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_creado
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo();

-- Perfiles para usuarios que ya existían antes de esta migración
insert into public.perfiles (id, nombre)
select id, coalesce(raw_user_meta_data ->> 'nombre', '')
from auth.users
on conflict (id) do nothing;

-- =========================================================
-- Seguridad a nivel de columna
-- El jugador puede editar sus datos, pero nunca su rol.
-- =========================================================

revoke update on public.perfiles from authenticated, anon;
grant update (nombre, talla_camiseta, consentimiento_imagen, visibilidad_publica)
  on public.perfiles to authenticated;

-- =========================================================
-- RLS
-- =========================================================

alter table public.perfiles enable row level security;

-- Cada usuario ve su propio perfil; el organizador ve todos
create policy "perfiles: leer propio o organizador"
  on public.perfiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.es_organizador())
  );

-- Cada usuario edita solo su propio perfil
create policy "perfiles: editar propio"
  on public.perfiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No hay políticas de insert ni delete para usuarios:
-- el alta la hace el trigger y el borrado cae en cascada desde auth.users.