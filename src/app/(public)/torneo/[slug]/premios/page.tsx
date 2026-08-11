// Ruta: src/app/(public)/torneo/[slug]/premios/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PremioRow = {
  id: string;
  tramo: string | null;
  posicion: string | null;
  descripcion: string;
  categorias: {
    nombre: string;
  } | null;
  sponsors: {
    nombre: string;
  } | null;
};

export default async function PremiosPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const { data: premios } = await supabase
    .from("premios")
    .select(
      "id, tramo, posicion, descripcion, categorias:categories(nombre), sponsors(nombre)",
    )
    .eq("tournament_id", torneo.id)
    .eq("visible", true)
    .returns<PremioRow[]>();

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Premios</h1>

      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      <ul className="space-y-3">
        {premios?.map((premio) => (
          <li key={premio.id} className="rounded-card bg-navy/5 px-5 py-4">
            <p className="text-xs text-sage uppercase mb-1">
              {premio.categorias?.nombre}

              {premio.tramo && ` · ${premio.tramo}`}

              {premio.posicion && ` · ${premio.posicion.replace(/_/g, " ")}`}
            </p>

            <p>{premio.descripcion}</p>

            {premio.sponsors?.nombre && (
              <p className="text-sm text-navy/60 mt-1">
                Cortesía de {premio.sponsors.nombre}
              </p>
            )}
          </li>
        ))}
      </ul>

      {!premios?.length && (
        <p className="text-navy/70">
          Los premios se irán desvelando a medida que se acerque el torneo.
          ¡Sorpresa!
        </p>
      )}
    </main>
  );
}
