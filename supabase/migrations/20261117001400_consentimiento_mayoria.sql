-- Confirmación de mayoría de edad o autorización del tutor (sin guardar la edad)
alter table public.consentimientos
  drop constraint consentimientos_tipo_check;

alter table public.consentimientos
  add constraint consentimientos_tipo_check
  check (tipo in ('privacidad', 'imagen', 'cookies_analitica', 'comunicaciones', 'mayoria_o_tutor'));