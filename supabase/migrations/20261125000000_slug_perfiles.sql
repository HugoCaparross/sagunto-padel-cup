alter table public.perfiles add column if not exists slug text;

update public.perfiles p
set slug = trim(both '-' from lower(regexp_replace(
    translate(
      coalesce(nullif(trim(p.nombre), ''), 'jugador'),
      'áéíóúüñÁÉÍÓÚÜÑ',
      'aeiouunAEIOUUN'
    ),
    '[^a-zA-Z0-9]+', '-', 'g'
  ))) || '-' || left(p.id::text, 6)
where p.slug is null;

create unique index if not exists perfiles_slug_key on public.perfiles (slug);
