// Ruta: src/app/(public)/torneo/[slug]/premios/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PremioRow = {
  id: string;
  tramo: string | null;
  posicion: string | null;
  descripcion: string;
  categorias: {
    id?: string;
    nombre: string;
  } | null;
  sponsors: {
    nombre: string;
  } | null;
};

type SearchParams = {
  categoria?: string;
  tramo?: string;
};

export default async function PremiosPage({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;

  const filters = await searchParams;

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
      "id, tramo, posicion, descripcion, categorias:categories(id, nombre), sponsors(nombre)",
    )
    .eq("tournament_id", torneo.id)
    .eq("visible", true)
    .returns<PremioRow[]>();

  const categoriaActiva = filters.categoria?.trim() ?? "";

  const tramoActivo = filters.tramo?.trim() ?? "";

  const premiosFiltrados = (premios ?? []).filter(
    (premio) =>
      (!categoriaActiva || premio.categorias?.id === categoriaActiva) &&
      (!tramoActivo || premio.tramo === tramoActivo),
  );

  const categorias = Array.from(
    new Map(
      (premios ?? [])
        .filter((premio) => premio.categorias?.id)
        .map((premio) => [premio.categorias!.id!, premio.categorias!]),
    ).values(),
  );

  const tramos = Array.from(
    new Set(
      (premios ?? [])
        .map((premio) => premio.tramo)
        .filter((tramo): tramo is string => Boolean(tramo)),
    ),
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Premios</h1>

        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      {premios?.length ? (
        <div className="mb-8 space-y-4">
          {categorias.length ? (
            <nav
              aria-label="Filtrar premios por categoría"
              className="overflow-x-auto"
            >
              <div className="flex min-w-max gap-2">
                <Link
                  href={`/torneo/${slug}/premios${
                    tramoActivo
                      ? `?tramo=${encodeURIComponent(tramoActivo)}`
                      : ""
                  }`}
                  className={`rounded-full px-3 py-2 text-sm ${
                    !categoriaActiva
                      ? "bg-navy text-offwhite"
                      : "bg-navy/5 text-navy/70"
                  }`}
                >
                  Todas
                </Link>

                {categorias.map((categoria) => {
                  const params = new URLSearchParams();

                  params.set("categoria", categoria.id!);

                  if (tramoActivo) {
                    params.set("tramo", tramoActivo);
                  }

                  return (
                    <Link
                      key={categoria.id}
                      href={`/torneo/${slug}/premios?${params.toString()}`}
                      className={`rounded-full px-3 py-2 text-sm ${
                        categoriaActiva === categoria.id
                          ? "bg-navy text-offwhite"
                          : "bg-navy/5 text-navy/70"
                      }`}
                    >
                      {categoria.nombre}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : null}

          {tramos.length ? (
            <nav
              aria-label="Filtrar premios por tramo"
              className="overflow-x-auto"
            >
              <div className="flex min-w-max gap-2">
                <Link
                  href={`/torneo/${slug}/premios${
                    categoriaActiva
                      ? `?categoria=${encodeURIComponent(categoriaActiva)}`
                      : ""
                  }`}
                  className={`rounded-full px-3 py-2 text-sm ${
                    !tramoActivo
                      ? "bg-navy text-offwhite"
                      : "bg-navy/5 text-navy/70"
                  }`}
                >
                  Todos los tramos
                </Link>

                {tramos.map((tramo) => {
                  const params = new URLSearchParams();

                  if (categoriaActiva) {
                    params.set("categoria", categoriaActiva);
                  }

                  params.set("tramo", tramo);

                  return (
                    <Link
                      key={tramo}
                      href={`/torneo/${slug}/premios?${params.toString()}`}
                      className={`rounded-full px-3 py-2 text-sm capitalize ${
                        tramoActivo === tramo
                          ? "bg-navy text-offwhite"
                          : "bg-navy/5 text-navy/70"
                      }`}
                    >
                      {tramo}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : null}
        </div>
      ) : null}

      {premiosFiltrados.length ? (
        <ul className="space-y-3">
          {premiosFiltrados.map((premio) => (
            <li key={premio.id} className="rounded-card bg-navy/5 px-5 py-4">
              <p className="mb-1 text-xs uppercase text-sage">
                {premio.categorias?.nombre}

                {premio.tramo ? ` · ${premio.tramo}` : ""}

                {premio.posicion
                  ? ` · ${premio.posicion.replace(/_/g, " ")}`
                  : ""}
              </p>

              <p className="font-semibold">{premio.descripcion}</p>

              {premio.sponsors?.nombre ? (
                <p className="mt-1 text-sm text-navy/60">
                  Cortesía de {premio.sponsors.nombre}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          {premios?.length
            ? "No hay premios que coincidan con los filtros seleccionados."
            : "Los premios se irán desvelando a medida que se acerque el torneo."}
        </section>
      )}
    </main>
  );
}
