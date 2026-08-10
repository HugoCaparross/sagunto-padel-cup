# Preparación de producción

Este documento enumera configuración externa necesaria. No sustituye una auditoría de Supabase ni una revisión legal.

## Variables de entorno

Copiar `.env.example` en cada entorno y configurar valores distintos para local, preview y producción.

| Variable | Exposición | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Pública | Canonical, sitemap, emails y URLs de Auth. Debe contener el dominio canónico HTTPS. |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | Cliente Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Cliente Supabase; depende de RLS correcto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Operaciones administrativas; no debe entrar en cliente, logs ni Git. |
| `ADMIN_EMAIL` | Solo servidor | Administración actual de un único correo. |
| `RESEND_API_KEY` | Solo servidor | Envío de correo. |
| `CONTACT_EMAIL` | Solo servidor | Buzón de contacto. |

## Supabase: controles manuales obligatorios

1. Activar y comprobar RLS para todas las tablas expuestas y para Storage.
2. Exportar las migraciones, constraints, índices, triggers, funciones y policies al repositorio antes de desplegar.
3. Configurar Site URL y Redirect URLs de Auth para el dominio de producción; probar confirmación y recuperación de contraseña.
4. Configurar SMTP de producción, dominio remitente y límites de Auth.
5. Revisar buckets, MIME/tamaño permitido y políticas de lectura/escritura/borrado.
6. Verificar backups, retención y un procedimiento de restauración.
7. Rotar inmediatamente la service role si se sospecha exposición.

## Vercel, dominio y observabilidad

1. Configurar las variables de producción en Vercel, sin copiar secretos a variables públicas.
2. Establecer el dominio canónico y redirección www/no-www; verificar HTTPS.
3. Tras publicar, validar `/robots.txt`, `/sitemap.xml`, canonical, Open Graph y Schema en el HTML real.
4. Conectar Vercel Analytics solo tras consentimiento y configurar logs/alertas.
5. Verificar el dominio en Google Search Console y Bing Webmaster Tools, y enviar el sitemap.

## Go/No-Go

No publicar hasta que `npm run lint`, `npm run typecheck` y `npm run build` terminen correctamente y se hayan probado registro, login, inscripción, cancelación, sorteo, resultados y ranking en una base de datos no productiva.
