-- =========================================================
-- DOMINIO: temporadas, pruebas, inscripciones, partidos,
-- escala de puntos, puntos y auditoría
-- Requiere la migración 20261117000000_perfiles.sql
-- =========================================================

-- ---------------------------------------------------------
-- TEMPORADAS
-- ---------------------------------------------------------
create table public.temporadas (
  id           bigint generated always as identity primary key,
  anio         text not null unique,                 -- p. ej. '2026-2027'
  fecha_inicio date not null,
  fecha_fin    date not null,
  activa       boolean not null default false,
  check (fecha_fin > fecha_inicio)
);

-- Solo puede haber una temporada activa
create unique index temporada_unica_activa
  on public.temporadas (activa) where activa;

-- ---------------------------------------------------------
-- PRUEBAS (fechas del circuito y Máster Final)
-- ---------------------------------------------------------
create table public.pruebas (
  id                      uuid primary key default gen_random_uuid(),
  temporada_id            bigint not null references public.temporadas (id),
  slug                    text not null unique,
  nombre                  text not null,
  fecha                   date not null,
  hora_inicio             time not null default '09:00',
  hora_fin                time not null default '13:00',
  sede                    text not null,
  sede_url                text,
  precio_pareja_centimos  integer not null check (precio_pareja_centimos >= 0),
  es_master               boolean not null default false,
  estado                  text not null default 'proxima'
                          check (estado in ('proxima', 'abierta', 'cerrada', 'en_curso', 'finalizada')),
  created_at              timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

-- ---------------------------------------------------------
-- CATEGORÍAS POR PRUEBA (cupo: tope de 12 parejas)
-- ---------------------------------------------------------
create table public.prueba_categorias (
  prueba_id  uuid not null references public.pruebas (id) on delete cascade,
  categoria  text not null check (categoria in ('segunda', 'tercera', 'cuarta')),
  cupo       integer not null default 12 check (cupo > 0),
  primary key (prueba_id, categoria)
);

-- ---------------------------------------------------------
-- INSCRIPCIONES (una fila = una pareja en una prueba)
-- ---------------------------------------------------------
create table public.inscripciones (
  id          uuid primary key default gen_random_uuid(),
  prueba_id   uuid not null references public.pruebas (id) on delete cascade,
  categoria   text not null,
  jugador_1   uuid not null references public.perfiles (id),
  jugador_2   uuid references public.perfiles (id),        -- null = busca pareja
  estado      text not null default 'pendiente'
              check (estado in ('pendiente', 'confirmada', 'pagada_en_prueba', 'lista_espera', 'retirada')),
  cuadro      text check (cuadro in ('oro', 'plata', 'bronce')),  -- se asigna al publicar cuadros
  created_at  timestamptz not null default now(),
  foreign key (prueba_id, categoria)
    references public.prueba_categorias (prueba_id, categoria),
  check (jugador_2 is null or jugador_2 <> jugador_1)
);

create index inscripciones_prueba_categoria_idx
  on public.inscripciones (prueba_id, categoria);
create index inscripciones_jugador_1_idx on public.inscripciones (jugador_1);
create index inscripciones_jugador_2_idx on public.inscripciones (jugador_2);

-- Reglas de inscripción: un jugador una sola vez por prueba y control de cupo.
-- El advisory lock evita que dos inscripciones simultáneas superen el cupo.
create or replace function public.validar_inscripcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cupo      integer;
  v_ocupadas  integer;
begin
  perform pg_advisory_xact_lock(hashtext(new.prueba_id::text || new.categoria));

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

  select pc.cupo into v_cupo
  from public.prueba_categorias pc
  where pc.prueba_id = new.prueba_id
    and pc.categoria = new.categoria;

  select count(*) into v_ocupadas
  from public.inscripciones i
  where i.prueba_id = new.prueba_id
    and i.categoria = new.categoria
    and i.estado in ('pendiente', 'confirmada', 'pagada_en_prueba');

  if new.estado = 'pendiente' and v_ocupadas >= v_cupo then
    new.estado := 'lista_espera';
  end if;

  return new;
end;
$$;

create trigger validar_inscripcion_antes
  before insert on public.inscripciones
  for each row execute function public.validar_inscripcion();

-- ---------------------------------------------------------
-- PARTIDOS (grupos y eliminatorias)
-- ---------------------------------------------------------
create table public.partidos (
  id             uuid primary key default gen_random_uuid(),
  prueba_id      uuid not null references public.pruebas (id) on delete cascade,
  categoria      text not null,
  cuadro         text not null check (cuadro in ('oro', 'plata', 'bronce')),
  fase           text not null check (fase in ('grupo', 'eliminatoria')),
  grupo          text,
  ronda          text,
  inscripcion_a  uuid references public.inscripciones (id) on delete cascade,
  inscripcion_b  uuid references public.inscripciones (id) on delete cascade,
  ganador_id     uuid references public.inscripciones (id) on delete set null,
  resultado      jsonb,                                -- sets y juegos, p. ej. [[6,4],[6,3]]
  foreign key (prueba_id, categoria)
    references public.prueba_categorias (prueba_id, categoria),
  check (inscripcion_a is null or inscripcion_b is null or inscripcion_a <> inscripcion_b)
);

create index partidos_prueba_idx on public.partidos (prueba_id, categoria, cuadro);

-- ---------------------------------------------------------
-- ESCALA DE PUNTOS (points_scale)
-- Los valores de 'ronda' deben coincidir con las 7 filas reales del circuito.
-- Los nombres de ejemplo se cambian en el seed, no aquí.
-- ---------------------------------------------------------
create table public.points_scale (
  categoria  text not null check (categoria in ('segunda', 'tercera', 'cuarta')),
  cuadro     text not null check (cuadro in ('oro', 'plata', 'bronce')),
  ronda      text not null check (ronda in (
               'ronda_1', 'ronda_2', 'ronda_3', 'cuartos', 'semifinal', 'final', 'campeon'
             )),
  puntos     integer not null check (puntos >= 0),
  primary key (categoria, cuadro, ronda)
);

-- ---------------------------------------------------------
-- PUNTOS OBTENIDOS (una fila por pareja y prueba)
-- El ranking se calcula en lib/ranking con ventana móvil de 12 meses
-- usando la columna fecha.
-- ---------------------------------------------------------
create table public.puntos_prueba (
  id              bigint generated always as identity primary key,
  inscripcion_id  uuid not null unique references public.inscripciones (id) on delete cascade,
  prueba_id       uuid not null references public.pruebas (id) on delete cascade,
  categoria       text not null,
  cuadro          text not null,
  ronda           text not null,
  puntos          integer not null check (puntos >= 0),
  fecha           date not null,
  foreign key (categoria, cuadro, ronda)
    references public.points_scale (categoria, cuadro, ronda)
);

create index puntos_prueba_fecha_idx on public.puntos_prueba (fecha);

-- ---------------------------------------------------------
-- AUDITORÍA (inmutable: solo escribe el servidor con la secret key)
-- ---------------------------------------------------------
create table public.auditoria (
  id           bigint generated always as identity primary key,
  usuario_id   uuid references public.perfiles (id) on delete set null,
  accion       text not null,
  tabla        text not null,
  registro_id  text,
  antes        jsonb,
  despues      jsonb,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------
-- VISTA DE OCUPACIÓN
-- Solo cuenta plazas ocupadas, sin datos personales.
-- Permite mostrar "plazas libres" en la web pública sin exponer inscripciones.
-- ---------------------------------------------------------
create or replace view public.v_ocupacion
with (security_invoker = false)
as
select
  i.prueba_id,
  i.categoria,
  count(*) filter (
    where i.estado in ('pendiente', 'confirmada', 'pagada_en_prueba')
  )::integer as ocupadas
from public.inscripciones i
group by i.prueba_id, i.categoria;

-- ---------------------------------------------------------
-- PRIVILEGIOS
-- Supabase concede por defecto todo a anon y authenticated.
-- RLS limita las filas; aquí limitamos además columnas y operaciones.
-- ---------------------------------------------------------
revoke insert, update, delete on public.inscripciones from anon, authenticated;
grant insert on public.inscripciones to authenticated;
grant update (estado) on public.inscripciones to authenticated;

revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;

grant select on public.v_ocupacion to anon, authenticated;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.temporadas        enable row level security;
alter table public.pruebas           enable row level security;
alter table public.prueba_categorias enable row level security;
alter table public.inscripciones     enable row level security;
alter table public.partidos          enable row level security;
alter table public.points_scale      enable row level security;
alter table public.puntos_prueba     enable row level security;
alter table public.auditoria         enable row level security;

-- Lectura pública del circuito (sitio público y ranking)
create policy "temporadas: lectura pública"
  on public.temporadas for select to anon, authenticated using (true);
create policy "pruebas: lectura pública"
  on public.pruebas for select to anon, authenticated using (true);
create policy "prueba_categorias: lectura pública"
  on public.prueba_categorias for select to anon, authenticated using (true);
create policy "partidos: lectura pública"
  on public.partidos for select to anon, authenticated using (true);
create policy "points_scale: lectura pública"
  on public.points_scale for select to anon, authenticated using (true);
create policy "puntos_prueba: lectura pública"
  on public.puntos_prueba for select to anon, authenticated using (true);

-- Organizador: escritura completa del circuito
create policy "temporadas: organizador escribe"
  on public.temporadas for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));
create policy "pruebas: organizador escribe"
  on public.pruebas for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));
create policy "prueba_categorias: organizador escribe"
  on public.prueba_categorias for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));
create policy "partidos: organizador escribe"
  on public.partidos for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));
create policy "points_scale: organizador escribe"
  on public.points_scale for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));
create policy "puntos_prueba: organizador escribe"
  on public.puntos_prueba for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- Inscripciones: el jugador ve las suyas, el organizador ve todas
create policy "inscripciones: ver propias o organizador"
  on public.inscripciones for select to authenticated
  using (
    jugador_1 = (select auth.uid())
    or jugador_2 = (select auth.uid())
    or (select public.es_organizador())
  );

-- El jugador se inscribe a sí mismo, siempre en estado pendiente y sin cuadro
create policy "inscripciones: jugador se inscribe"
  on public.inscripciones for insert to authenticated
  with check (
    jugador_1 = (select auth.uid())
    and estado = 'pendiente'
    and cuadro is null
  );

-- El jugador solo puede retirarse; no puede confirmarse a sí mismo
create policy "inscripciones: jugador se retira"
  on public.inscripciones for update to authenticated
  using (
    jugador_1 = (select auth.uid())
    or jugador_2 = (select auth.uid())
  )
  with check (estado = 'retirada');

-- El organizador gestiona cualquier inscripción
create policy "inscripciones: organizador gestiona"
  on public.inscripciones for update to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- Auditoría: solo el organizador la consulta; nadie la escribe desde el cliente
create policy "auditoria: organizador lee"
  on public.auditoria for select to authenticated
  using ((select public.es_organizador()));