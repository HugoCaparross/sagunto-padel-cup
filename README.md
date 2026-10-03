# Sagunto Padel Cup

Plataforma web del circuito Sagunto Padel Cup para consultar torneos, calendario,
clasificaciones, jugadores y noticias, además de gestionar cuentas y operar torneos.

## Requisitos

- Node.js (el proyecto se ha validado con Node 24).
- npm.
- Un proyecto Supabase con el esquema y las políticas RLS que espera
  `src/types/database.ts`.

## Configuración local

Instala dependencias con `npm ci` y crea `.env.local` en la raíz:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La clave anónima es pública y las operaciones deben protegerse mediante sesión,
autorización en servidor y RLS. No añadas una clave `service_role` a variables
`NEXT_PUBLIC_*` ni al cliente.

Inicia el servidor de desarrollo con:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Comprobaciones

```bash
npm run lint
npm run qa
npm run build
npm run start
```

`npm run qa` comprueba rutas públicas, algunas condiciones de contenido, lint y
TypeScript. No sustituye pruebas de integración con Supabase ni pruebas de los
flujos deportivos.

## Estructura

- `src/app/(public)`: páginas públicas, torneos, ranking, jugadores, circuito,
  noticias y contenido legal.
- `src/app/(auth)`: registro, inicio de sesión y recuperación de cuenta.
- `src/app/(app)`: inicio privado del jugador, perfil y seguridad.
- `src/app/(admin)`: panel administrativo y gestión de torneos.
- `src/lib/competition`: reglas de competición, cuadros, grupos, ranking y
  temporadas.
- `src/lib/services`: acceso a datos y operaciones de negocio con Supabase.
- `src/types/database.ts`: tipos TypeScript del esquema esperado.
- `supabase/schema.sql`: exportación de esquema usada como evidencia de las
  tablas y políticas actuales.
- `supabase/migrations`: migraciones revisables para perfiles/datos privados y
  capacidad ilimitada por categoría. Validarlas en local/staging antes de aplicarlas.
- `supabase/seed/official-calendar-2026-2027.sql`: calendario aprobado y
  categorías iniciales; ejecutar después de las migraciones solo en local/staging.
- `docs/implementation-status.md`: matriz de estado, verificaciones y decisiones
  de producto pendientes.

## Estado conocido

El pago de inscripciones se realiza fuera de la plataforma. El panel incluye
dashboard, torneos, listados de jugadores e inscripciones, programación de
partidos, ranking y noticias. La operación de cuadros/captura de resultados,
perfiles detallados, galería y configuración aún necesita páginas propias.
`schema.sql` es una exportación y no una secuencia
de migraciones. Las migraciones nuevas deben probarse en local/staging y el resto
de políticas RLS debe revisarse antes de operar con datos reales.
