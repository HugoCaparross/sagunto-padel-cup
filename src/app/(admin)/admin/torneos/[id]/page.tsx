// Ruta: src/app/(admin)/admin/torneos/[id]/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import TournamentDetailForm from "@/components/admin/TournamentDetailForm";
import { ESTADO_TORNEO, formatearFecha } from "@/lib/estados";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTorneoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } = await admin
    .from("tournaments")
    .select(
      "id, nombre, slug, estado, club_id, precio_texto, descripcion, fecha_inicio, fecha_fin",
    )
    .eq("id", id)
    .maybeSingle();

  if (torneoError) {
    console.error("[admin/torneo] Error cargando torneo:", torneoError);
  }

  if (!torneo) {
    notFound();
  }

  const [
    { data: categorias, error: categoriasError },
    { data: categoriasActivas, error: categoriasActivasError },
    { data: clubs, error: clubsError },
    { count: inscripcionesCount, error: inscripcionesError },
  ] = await Promise.all([
    admin.from("categories").select("id, nombre").order("nivel_orden"),

    admin
      .from("tournament_categories")
      .select("categoria_id, cupo_minimo, cupo_maximo")
      .eq("tournament_id", id),

    admin.from("clubs").select("id, nombre").order("nombre"),

    admin
      .from("pairs")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id)
      .eq("estado", "confirmada"),
  ]);

  if (
    categoriasError ||
    categoriasActivasError ||
    clubsError ||
    inscripcionesError
  ) {
    console.error("[admin/torneo] Error cargando configuración:", {
      categoriasError,
      categoriasActivasError,
      clubsError,
      inscripcionesError,
    });
  }

  const clubActual = clubs?.find((club) => club.id === torneo.club_id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">
            Administración · Torneo
          </p>

          <span className="text-xs text-offwhite/35">{torneo.slug}</span>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              {torneo.nombre}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-offwhite/55">
              <span>{formatearFecha(torneo.fecha_inicio)}</span>

              {torneo.fecha_fin && torneo.fecha_fin !== torneo.fecha_inicio ? (
                <span>Hasta {formatearFecha(torneo.fecha_fin)}</span>
              ) : null}

              <span>{clubActual?.nombre ?? "Club pendiente"}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 md:items-end">
            <span className="text-xs uppercase tracking-[0.1em] text-offwhite/40">
              Estado
            </span>

            <span className="text-sm font-semibold text-sage">
              {ESTADO_TORNEO[torneo.estado] ?? torneo.estado}
            </span>
          </div>
        </div>
      </header>

      <section
        aria-label="Resumen operativo"
        className="mb-8 grid grid-cols-2 border-y border-offwhite/10 md:grid-cols-4"
      >
        <div className="border-r border-offwhite/10 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Inscripciones
          </p>

          <p className="mt-1 font-display text-2xl">
            {inscripcionesCount ?? 0}
          </p>
        </div>

        <div className="border-b border-offwhite/10 px-4 py-4 md:border-b-0 md:border-r">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Categorías
          </p>

          <p className="mt-1 font-display text-2xl">
            {categoriasActivas?.length ?? 0}
          </p>
        </div>

        <div className="border-r border-offwhite/10 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Sede
          </p>

          <p className="mt-1 truncate text-sm font-medium">
            {clubActual?.nombre ?? "Pendiente"}
          </p>
        </div>

        <div className="px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Identificador
          </p>

          <p className="mt-1 truncate text-sm font-medium">{torneo.slug}</p>
        </div>
      </section>

      <TournamentDetailForm
        torneoId={torneo.id}
        estadoActual={torneo.estado}
        clubActualId={torneo.club_id}
        clubs={clubs ?? []}
        categorias={categorias ?? []}
        categoriasActivas={categoriasActivas ?? []}
        precioInicial={torneo.precio_texto ?? ""}
        descripcionInicial={torneo.descripcion ?? ""}
      />
    </main>
  );
}
