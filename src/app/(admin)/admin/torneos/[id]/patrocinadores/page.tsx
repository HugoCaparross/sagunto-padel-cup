// Ruta: src/app/(admin)/admin/torneos/[id]/patrocinadores/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import PatrocinadoresManager from "@/components/admin/PatrocinadoresManager";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPatrocinadoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: sponsors, error: sponsorsError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin
      .from("sponsors")
      .select("id, nombre, descripcion, tipo")
      .eq("tournament_id", id)
      .order("orden", {
        ascending: true,
      }),
  ]);

  if (torneoError) {
    console.error("[admin/patrocinadores] Error cargando torneo:", torneoError);
  }

  if (sponsorsError) {
    console.error(
      "[admin/patrocinadores] Error cargando patrocinadores:",
      sponsorsError,
    );
  }

  if (!torneo) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Torneo
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Patrocinadores
            </h1>

            <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
          </div>

          <p className="text-xs text-offwhite/40">
            {sponsors?.length ?? 0}{" "}
            {(sponsors?.length ?? 0) === 1 ? "patrocinador" : "patrocinadores"}
          </p>
        </div>
      </header>

      {sponsorsError ? (
        <section
          role="alert"
          className="mb-6 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar todos los patrocinadores
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Inténtalo de nuevo. No se ha realizado ninguna modificación sobre
            los datos existentes.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="gestion-patrocinadores">
        <div className="mb-5">
          <h2 id="gestion-patrocinadores" className="font-display text-xl">
            Gestión de patrocinadores
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-offwhite/55">
            Añade y administra las entidades que aparecen asociadas a esta
            prueba.
          </p>
        </div>

        <PatrocinadoresManager
          torneoId={id}
          sponsorsIniciales={sponsors ?? []}
        />
      </section>
    </main>
  );
}
