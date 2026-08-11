// Ruta: src/app/(admin)/admin/noticias/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import NoticiasManager from "@/components/admin/NoticiasManager";

export const dynamic = "force-dynamic";

export default async function AdminNoticiasPage() {
  const admin = createAdminClient();

  const { data: noticias, error } = await admin
    .from("news")
    .select("id, titulo, estado")
    .order("fecha_publicacion", {
      ascending: false,
      nullsFirst: false,
    });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración
        </p>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Noticias
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-offwhite/60">
              Crea, revisa, publica y mantiene el contenido editorial del
              circuito.
            </p>
          </div>

          <p className="text-sm text-offwhite/45">
            {noticias?.length ?? 0}{" "}
            {(noticias?.length ?? 0) === 1
              ? "noticia"
              : "noticias"}
          </p>
        </div>
      </header>

      {error ? (
        <section
          role="alert"
          className="mb-6 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar las noticias
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/65">
            Inténtalo de nuevo. No se ha realizado ninguna modificación
            sobre el contenido.
          </p>
        </section>
      ) : null}

      <NoticiasManager noticiasIniciales={noticias ?? []} />
    </main>
  );
}