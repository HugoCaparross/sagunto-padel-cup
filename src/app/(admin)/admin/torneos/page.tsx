// Ruta: src/app/(admin)/admin/torneos/page.tsx

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import TournamentForm from "@/components/admin/TournamentForm";
import { ESTADO_TORNEO, formatearFecha } from "@/lib/estados";

export const dynamic = "force-dynamic";

export default async function AdminTorneosPage() {
  const admin = createAdminClient();

  const [
    { data: torneos, error: torneosError },
    { data: clubs, error: clubsError },
  ] = await Promise.all([
    admin
      .from("tournaments")
      .select("id, nombre, slug, estado, fecha_inicio, fecha_fin, club_id")
      .order("fecha_inicio", { ascending: false }),

    admin.from("clubs").select("id, nombre").order("nombre"),
  ]);

  const hasError = Boolean(torneosError) || Boolean(clubsError);

  if (hasError) {
    console.error("[admin/torneos] Error cargando datos:", {
      torneosError,
      clubsError,
    });
  }

  const clubesPorId = new Map(
    (clubs ?? []).map((club) => [club.id, club.nombre]),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración
        </p>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Torneos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-offwhite/60">
              Gestiona las pruebas de la temporada y accede a su configuración,
              inscripciones y operaciones competitivas.
            </p>
          </div>

          <p className="text-sm text-offwhite/45">
            {torneos?.length ?? 0}{" "}
            {(torneos?.length ?? 0) === 1 ? "torneo" : "torneos"}
          </p>
        </div>
      </header>

      {hasError ? (
        <section
          role="alert"
          className="mb-8 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar todos los torneos
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/65">
            Inténtalo de nuevo. Si el problema continúa, revisa la configuración
            del sistema.
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="crear-torneo"
        className="border-b border-offwhite/10 pb-8"
      >
        <div className="mb-5">
          <h2 id="crear-torneo" className="font-display text-xl">
            Crear torneo
          </h2>

          <p className="mt-1 text-sm text-offwhite/55">
            Guarda inicialmente la prueba como borrador para completar su
            configuración antes de publicarla.
          </p>
        </div>

        <TournamentForm />
      </section>

      <section aria-labelledby="listado-torneos" className="pt-8">
        <div className="mb-5">
          <h2 id="listado-torneos" className="font-display text-xl">
            Pruebas de la temporada
          </h2>
        </div>

        {torneos && torneos.length > 0 ? (
          <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
            {torneos.map((torneo) => (
              <li key={torneo.id}>
                <Link
                  href={`/admin/torneos/${torneo.id}`}
                  className="group block px-1 py-5 transition-colors hover:bg-offwhite/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold md:text-base">
                        {torneo.nombre}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-offwhite/50">
                        <span>{formatearFecha(torneo.fecha_inicio)}</span>

                        {torneo.fecha_fin &&
                        torneo.fecha_fin !== torneo.fecha_inicio ? (
                          <span>Hasta {formatearFecha(torneo.fecha_fin)}</span>
                        ) : null}

                        <span>
                          {torneo.club_id
                            ? (clubesPorId.get(torneo.club_id) ??
                              "Club no disponible")
                            : "Club pendiente"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-sage">
                        {ESTADO_TORNEO[torneo.estado] ?? torneo.estado}
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-offwhite/30 transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-offwhite/15 px-5 py-10">
            <h3 className="text-sm font-semibold">No hay torneos creados</h3>

            <p className="mt-1 text-sm text-offwhite/55">
              Crea la primera prueba desde el formulario anterior.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
