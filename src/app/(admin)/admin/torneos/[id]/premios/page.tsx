// Ruta: src/app/(admin)/admin/torneos/[id]/premios/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import PremiosManager from "@/components/admin/PremiosManager";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPremiosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: categorias, error: categoriasError },
    { data: sponsors, error: sponsorsError },
    { data: premios, error: premiosError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin.from("categories").select("id, nombre").order("nivel_orden"),

    admin
      .from("sponsors")
      .select("id, nombre")
      .eq("tournament_id", id)
      .order("orden"),

    admin
      .from("premios")
      .select(
        "id, categoria_id, tramo, posicion, descripcion, patrocinador_id, visible",
      )
      .eq("tournament_id", id)
      .order("visible", {
        ascending: false,
      })
      .order("id"),
  ]);

  if (torneoError) {
    console.error("[admin/premios] Error cargando torneo:", torneoError);
  }

  if (categoriasError) {
    console.error(
      "[admin/premios] Error cargando categorías:",
      categoriasError,
    );
  }

  if (sponsorsError) {
    console.error(
      "[admin/premios] Error cargando patrocinadores:",
      sponsorsError,
    );
  }

  if (premiosError) {
    console.error("[admin/premios] Error cargando premios:", premiosError);
  }

  if (!torneo) {
    notFound();
  }

  const hasError =
    Boolean(categoriasError) || Boolean(sponsorsError) || Boolean(premiosError);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Torneo
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Premios
            </h1>

            <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
          </div>

          <p className="text-xs text-offwhite/40">
            {premios?.length ?? 0}{" "}
            {(premios?.length ?? 0) === 1 ? "premio" : "premios"}
          </p>
        </div>
      </header>

      {hasError ? (
        <section
          role="alert"
          className="mb-6 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar todos los datos
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Revisa la conexión e inténtalo de nuevo antes de modificar los
            premios.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="gestion-premios">
        <div className="mb-5">
          <h2 id="gestion-premios" className="font-display text-xl">
            Gestión de premios
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-offwhite/55">
            Configura los premios asociados a cada categoría, tramo y posición.
          </p>
        </div>

        <PremiosManager
          torneoId={id}
          categorias={categorias ?? []}
          sponsors={sponsors ?? []}
          premiosIniciales={premios ?? []}
        />
      </section>
    </main>
  );
}
