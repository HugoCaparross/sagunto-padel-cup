-- =========================================================
-- NOTICIAS y CONTACTOS (consultas y sugerencias)
-- Requiere 20261117000000_perfiles.sql y 20261117000700_horarios_plazas_legal.sql
-- =========================================================

-- ---------------------------------------------------------
-- NOTICIAS
-- ---------------------------------------------------------
create table public.noticias (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo       text not null check (char_length(titulo) between 5 and 140),
  resumen      text not null check (char_length(resumen) between 10 and 300),
  contenido    text not null check (char_length(contenido) between 20 and 50000),
  categoria    text not null check (categoria in ('circuito', 'resultados', 'inscripciones', 'general')),
  imagen_url   text check (imagen_url is null or char_length(imagen_url) <= 500),
  publicada    boolean not null default false,
  publicada_at timestamptz,
  autor_id     uuid references public.perfiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (not publicada or publicada_at is not null)
);

create index noticias_publicadas_idx
  on public.noticias (publicada_at desc) where publicada;

create or replace function public.actualizar_fecha_noticia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger noticias_updated_at
  before update on public.noticias
  for each row execute function public.actualizar_fecha_noticia();

alter table public.noticias enable row level security;

-- Cualquiera lee las publicadas; el organizador lee y escribe todas
create policy "noticias: lectura de publicadas o organizador"
  on public.noticias for select to anon, authenticated
  using (publicada or (select public.es_organizador()));

create policy "noticias: organizador escribe"
  on public.noticias for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- ---------------------------------------------------------
-- CONTACTOS (consultas y sugerencias)
-- Solo se insertan desde el servidor con la clave de servicio.
-- ---------------------------------------------------------
create table public.contactos (
  id                        uuid primary key default gen_random_uuid(),
  tipo                      text not null check (tipo in ('consulta', 'sugerencia')),
  nombre                    text not null check (char_length(nombre) between 2 and 80),
  email                     text not null check (char_length(email) between 5 and 254),
  mensaje                   text not null check (char_length(mensaje) between 10 and 2000),
  perfil_id                 uuid references public.perfiles (id) on delete set null,
  estado                    text not null default 'nueva'
                            check (estado in ('nueva', 'en_curso', 'respondida', 'archivada')),
  notas_internas            text check (notas_internas is null or char_length(notas_internas) <= 2000),
  consentimiento_at         timestamptz not null,
  documento_privacidad_id   uuid references public.documentos_legales (id),
  created_at                timestamptz not null default now(),
  respondida_at             timestamptz,
  check (estado <> 'respondida' or respondida_at is not null)
);

create index contactos_estado_idx on public.contactos (estado, created_at desc);
create index contactos_email_idx on public.contactos (email, created_at desc);

alter table public.contactos enable row level security;

create policy "contactos: organizador lee"
  on public.contactos for select to authenticated
  using ((select public.es_organizador()));

create policy "contactos: organizador actualiza"
  on public.contactos for update to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- Permisos por columna: el organizador solo cambia estado, notas y fecha de respuesta
revoke all on public.contactos from anon;
revoke insert, delete on public.contactos from authenticated;
revoke update on public.contactos from authenticated;
grant update (estado, notas_internas, respondida_at) on public.contactos to authenticated;