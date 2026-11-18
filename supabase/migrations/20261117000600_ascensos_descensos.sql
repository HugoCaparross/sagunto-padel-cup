-- Plazas configurables por temporada
alter table public.temporadas
  add column plazas_ascenso integer not null default 2 check (plazas_ascenso >= 0),
  add column plazas_descenso integer not null default 2 check (plazas_descenso >= 0);

-- Propuestas generadas al cerrar una temporada
create table public.propuestas_categoria (
  id                    uuid primary key default gen_random_uuid(),
  temporada_id          bigint not null references public.temporadas (id) on delete cascade,
  temporada_destino_id  bigint not null references public.temporadas (id) on delete cascade,
  jugador_id            uuid not null references public.perfiles (id) on delete cascade,
  tipo                  text not null check (tipo in ('ascenso', 'descenso')),
  categoria_origen      text not null check (categoria_origen in ('primera', 'segunda', 'tercera', 'cuarta')),
  categoria_propuesta   text not null check (categoria_propuesta in ('primera', 'segunda', 'tercera', 'cuarta')),
  posicion              integer not null check (posicion > 0),
  empate_en_frontera    boolean not null default false,
  estado                text not null default 'pendiente'
                        check (estado in ('pendiente', 'confirmada', 'modificada')),
  categoria_final       text check (categoria_final in ('primera', 'segunda', 'tercera', 'cuarta')),
  motivo                text,
  resuelta_por          uuid references public.perfiles (id) on delete set null,
  resuelta_at           timestamptz,
  created_at            timestamptz not null default now(),
  check (categoria_propuesta <> categoria_origen),
  check (estado = 'pendiente' or (categoria_final is not null and resuelta_at is not null))
);

-- Solo una propuesta pendiente por jugador y temporada de destino
create unique index propuesta_pendiente_unica
  on public.propuestas_categoria (temporada_destino_id, jugador_id)
  where estado = 'pendiente';

-- Categoría que tendrá cada jugador en la temporada de destino
create table public.categorias_temporada (
  temporada_id  bigint not null references public.temporadas (id) on delete cascade,
  jugador_id    uuid not null references public.perfiles (id) on delete cascade,
  categoria     text not null check (categoria in ('primera', 'segunda', 'tercera', 'cuarta')),
  origen        text not null check (origen in ('ascenso', 'descenso', 'manual')),
  primary key (temporada_id, jugador_id)
);

alter table public.propuestas_categoria enable row level security;
alter table public.categorias_temporada enable row level security;

create policy "propuestas: organizador gestiona"
  on public.propuestas_categoria for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

create policy "categorias_temporada: organizador gestiona"
  on public.categorias_temporada for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

create policy "categorias_temporada: jugador lee la propia"
  on public.categorias_temporada for select to authenticated
  using (jugador_id = (select auth.uid()));