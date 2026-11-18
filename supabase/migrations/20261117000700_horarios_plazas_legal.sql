-- =========================================================
-- Pistas, horarios, plazas por prueba, duraciones,
-- documentos legales y consentimientos
-- =========================================================

-- ---------------------------------------------------------
-- 1. PLAZAS Y DURACIONES POR PRUEBA
-- ---------------------------------------------------------
alter table public.pruebas
  add column plazas_maximas integer not null default 24 check (plazas_maximas > 0),
  add column duracion_grupo_min integer not null default 50 check (duracion_grupo_min > 0),
  add column duracion_fase_final_min integer not null default 70 check (duracion_fase_final_min > 0),
  add column duracion_final_min integer not null default 100 check (duracion_final_min > 0),
  add column descanso_min integer not null default 10 check (descanso_min >= 0);

-- Ya no hay cupo por categoría: el control es el tope total de la prueba
alter table public.prueba_categorias drop column cupo;

-- ---------------------------------------------------------
-- 2. PISTAS (las crea el organizador según el club)
-- ---------------------------------------------------------
create table public.pistas (
  id          uuid primary key default gen_random_uuid(),
  prueba_id   uuid not null references public.pruebas (id) on delete cascade,
  numero      integer not null check (numero > 0),
  unique (prueba_id, numero)
);

alter table public.pistas enable row level security;

create policy "pistas: lectura pública"
  on public.pistas for select to anon, authenticated using (true);

create policy "pistas: organizador escribe"
  on public.pistas for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- ---------------------------------------------------------
-- 3. HORARIOS EN PARTIDOS
-- Pista y hora quedan vacías hasta que el organizador las asigna.
-- ---------------------------------------------------------
alter table public.partidos
  add column formato text not null default 'grupo'
    check (formato in ('grupo', 'fase_final', 'final')),
  add column pista_id uuid references public.pistas (id) on delete set null,
  add column inicio timestamptz,
  add column fin timestamptz,
  add constraint partidos_horario_coherente check (
    (pista_id is null) = (inicio is null)
    and (inicio is null) = (fin is null)
  ),
  add constraint partidos_fin_posterior check (
    fin is null or inicio is null or fin > inicio
  );

-- Impide dos partidos solapados en la misma pista
create extension if not exists btree_gist;

alter table public.partidos
  add constraint partidos_pista_sin_solape
  exclude using gist (
    pista_id with =,
    tstzrange(inicio, fin) with &&
  )
  where (pista_id is not null);

-- ---------------------------------------------------------
-- 4. PLAZAS: tope total por prueba
-- Sustituye al trigger anterior: el cupo es de la prueba, no de la categoría.
-- ---------------------------------------------------------
create or replace function public.validar_inscripcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plazas   integer;
  v_ocupadas integer;
begin
  perform pg_advisory_xact_lock(hashtext(new.prueba_id::text));

  if exists (
    select 1
    from public.inscripciones i
    where i.prueba_id = new.prueba_id
      and i.estado <> 'retirada'
      and (
        i.jugador_1 in (new.jugador_1, coalesce(new.jugador_2, new.jugador_1))
        or i.jugador_2 in (new.jugador_1, coalesce(new.jugador_2, new.jugador_1))
      )
  ) then
    raise exception 'Algún jugador ya está inscrito en esta prueba'
      using errcode = 'unique_violation';
  end if;

  select p.plazas_maximas into v_plazas
  from public.pruebas p
  where p.id = new.prueba_id;

  select count(*) into v_ocupadas
  from public.inscripciones i
  where i.prueba_id = new.prueba_id
    and i.estado in ('pendiente', 'confirmada', 'pagada_en_prueba');

  if new.estado = 'pendiente' and v_ocupadas >= v_plazas then
    new.estado := 'lista_espera';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------
-- 5. DOCUMENTOS LEGALES (versionados, nunca se borran)
-- ---------------------------------------------------------
create table public.documentos_legales (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in (
                 'aviso_legal', 'privacidad', 'cookies',
                 'condiciones_inscripcion', 'reglamento')),
  version      integer not null check (version > 0),
  titulo       text not null,
  contenido    text not null,
  vigente      boolean not null default false,
  publicado_at timestamptz not null default now(),
  unique (tipo, version)
);

-- Solo una versión vigente por tipo de documento
create unique index documento_vigente_unico
  on public.documentos_legales (tipo) where vigente;

alter table public.documentos_legales enable row level security;

create policy "documentos_legales: lectura pública"
  on public.documentos_legales for select to anon, authenticated using (true);

create policy "documentos_legales: organizador inserta"
  on public.documentos_legales for insert to authenticated
  with check ((select public.es_organizador()));

create policy "documentos_legales: organizador actualiza"
  on public.documentos_legales for update to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

revoke delete on public.documentos_legales from anon, authenticated;

-- ---------------------------------------------------------
-- 6. CONSENTIMIENTOS (prueba de consentimiento, inmutable)
-- ---------------------------------------------------------
create table public.consentimientos (
  id            bigint generated always as identity primary key,
  perfil_id     uuid not null references public.perfiles (id) on delete cascade,
  tipo          text not null check (tipo in (
                  'privacidad', 'imagen', 'cookies_analitica', 'comunicaciones')),
  documento_id  uuid references public.documentos_legales (id),
  concedido     boolean not null,
  registrado_at timestamptz not null default now()
);

alter table public.consentimientos enable row level security;

create policy "consentimientos: jugador registra el propio"
  on public.consentimientos for insert to authenticated
  with check (perfil_id = (select auth.uid()));

create policy "consentimientos: leer propio o organizador"
  on public.consentimientos for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or (select public.es_organizador())
  );

revoke update, delete on public.consentimientos from anon, authenticated;