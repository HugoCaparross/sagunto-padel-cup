// Ruta: src/app/(admin)/admin/torneos/[id]/galeria/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import GaleriaManager from "@/components/admin/GaleriaManager";
import AccesoColaboradorForm from "@/components/admin/AccesoColaboradorForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminGaleriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: fotos, error: fotosError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin
      .from("gallery_items")
      .select("id, url")
      .eq("tournament_id", id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (torneoError) {
    console.error("[admin/galeria] Error cargando torneo:", torneoError);
  }

  if (fotosError) {
    console.error("[admin/galeria] Error cargando fotografías:", fotosError);
  }

  if (!torneo) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Contenido
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Galería
        </h1>

        <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
      </header>

      {fotosError ? (
        <section
          role="alert"
          className="mb-8 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se ha podido cargar la galería
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Puedes volver a intentarlo. Las fotografías existentes no se han
            modificado.
          </p>
        </section>
      ) : null}

      <div className="space-y-10">
        <section aria-labelledby="acceso-colaborador">
          <div className="mb-4">
            <h2 id="acceso-colaborador" className="font-display text-xl">
              Acceso de colaborador
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-offwhite/55">
              Genera un enlace temporal para que un fotógrafo o videógrafo pueda
              aportar material sin acceder al backoffice.
            </p>
          </div>

          <AccesoColaboradorForm torneoId={id} />
        </section>

        <section aria-labelledby="fotos-torneo">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="fotos-torneo" className="font-display text-xl">
                Fotografías
              </h2>

              <p className="mt-1 text-sm text-offwhite/55">
                {fotos?.length ?? 0}{" "}
                {(fotos?.length ?? 0) === 1 ? "fotografía" : "fotografías"}
              </p>
            </div>
          </div>

          <GaleriaManager torneoId={id} fotosIniciales={fotos ?? []} />
        </section>
      </div>
    </main>
  );
}
