-- =========================================================
-- PATROCINADORES, PRUEBAS PATROCINADAS y PREMIOS
-- =========================================================

create table public.patrocinadores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 2 and 120),
  logo_url    text not null check (char_length(logo_url) <= 500),
  web_url     text check (web_url is null or char_length(web_url) <= 500),
  tipo        text not null default 'comercial' check (tipo in ('institucional', 'comercial')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.prueba_patrocinadores (
  prueba_id       uuid not null references public.pruebas (id) on delete cascade,
  patrocinador_id uuid not null references public.patrocinadores (id) on delete cascade,
  primary key (prueba_id, patrocinador_id)
);

-- Un premio por prueba, categoría y cuadro.
-- revelar_at: null = visible ya; fecha futura = bloqueado hasta esa fecha.
create table public.premios (
  id           uuid primary key default gen_random_uuid(),
  prueba_id    uuid not null references public.pruebas (id) on delete cascade,
  categoria    text not null check (categoria in ('primera', 'segunda', 'tercera', 'cuarta')),
  cuadro       text not null check (cuadro in ('oro', 'plata', 'bronce')),
  descripcion  text not null check (char_length(descripcion) between 3 and 300),
  revelar_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (prueba_id, categoria, cuadro)
);

alter table public.patrocinadores enable row level security;
alter table public.prueba_patrocinadores enable row level security;
alter table public.premios enable row level security;

-- Patrocinadores activos: lectura pública. El organizador ve también los inactivos.
create policy "patrocinadores: lectura de activos"
  on public.patrocinadores for select to anon, authenticated
  using (activo or (select public.es_organizador()));

create policy "patrocinadores: organizador escribe"
  on public.patrocinadores for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

create policy "prueba_patrocinadores: lectura pública"
  on public.prueba_patrocinadores for select to anon, authenticated
  using (true);

create policy "prueba_patrocinadores: organizador escribe"
  on public.prueba_patrocinadores for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- Premios: sin lectura pública. Se leen desde el servidor, que oculta los bloqueados.
create policy "premios: solo organizador"
  on public.premios for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));