// Ruta: src/app/(admin)/admin/torneos/[id]/sorteo/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import SorteoButton from "@/components/admin/SorteoButton";
import { notFound } from "next/navigation";

type StandingRow = {
  group_id: string;
  pair: {
    player1: {
      nombre: string;
      apellidos: string;
    } | null;
    player2: {
      nombre: string;
      apellidos: string;
    } | null;
  } | null;
};

type CategoriaRow = {
  categoria_id: string;
  categories: {
    nombre: string;
  } | null;
};

type GrupoRow = {
  id: string;
  nombre: string;
  categoria_id: string;
};

export const dynamic = "force-dynamic";

export default async function SorteoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: categorias, error: categoriasError },
    { data: grupos, error: gruposError },
    { data: standings, error: standingsError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin
      .from("tournament_categories")
      .select("categoria_id, categories(nombre)")
      .eq("tournament_id", id)
      .returns<CategoriaRow[]>(),

    admin
      .from("groups")
      .select("id, nombre, categoria_id")
      .eq("tournament_id", id)
      .order("nombre")
      .returns<GrupoRow[]>(),

    admin
      .from("group_standings")
      .select(
        "group_id, pair:pairs(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
      )
      .returns<StandingRow[]>(),
  ]);

  if (torneoError) {
    console.error("[admin/sorteo] Error cargando torneo:", torneoError);
  }

  if (categoriasError) {
    console.error("[admin/sorteo] Error cargando categorías:", categoriasError);
  }

  if (gruposError) {
    console.error("[admin/sorteo] Error cargando grupos:", gruposError);
  }

  if (standingsError) {
    console.error(
      "[admin/sorteo] Error cargando clasificación:",
      standingsError,
    );
  }

  if (!torneo) {
    notFound();
  }

  const hasError =
    Boolean(categoriasError) || Boolean(gruposError) || Boolean(standingsError);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Competición
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Sorteo
        </h1>

        <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
      </header>

      {hasError ? (
        <section
          role="alert"
          className="mb-8 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se ha podido cargar toda la información del sorteo
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Revisa la información antes de generar una nueva estructura.
          </p>
        </section>
      ) : null}

      {!categorias?.length ? (
        <section className="border border-dashed border-offwhite/15 px-5 py-8">
          <h2 className="text-sm font-semibold">
            No hay categorías configuradas
          </h2>

          <p className="mt-1 text-sm text-offwhite/50">
            Configura primero las categorías disputadas en el detalle del
            torneo.
          </p>
        </section>
      ) : null}

      {categorias?.map((categoria) => {
        const gruposCategoria =
          grupos?.filter(
            (grupo) => grupo.categoria_id === categoria.categoria_id,
          ) ?? [];

        const nombreCategoria = categoria.categories?.nombre ?? "Categoría";

        return (
          <section
            key={categoria.categoria_id}
            className="mb-12"
            aria-labelledby={`categoria-${categoria.categoria_id}`}
          >
            <div className="mb-5 flex flex-col gap-4 border-b border-offwhite/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id={`categoria-${categoria.categoria_id}`}
                  className="font-display text-2xl"
                >
                  {nombreCategoria}
                </h2>

                <p className="mt-1 text-sm text-offwhite/50">
                  {gruposCategoria.length}{" "}
                  {gruposCategoria.length === 1
                    ? "grupo generado"
                    : "grupos generados"}
                </p>
              </div>

              <SorteoButton
                torneoId={id}
                categoriaId={categoria.categoria_id}
              />
            </div>

            {!gruposCategoria.length ? (
              <div className="border border-dashed border-offwhite/15 px-5 py-8">
                <p className="text-sm font-semibold">
                  Aún no se ha generado el sorteo.
                </p>

                <p className="mt-1 text-sm leading-6 text-offwhite/50">
                  La generación requiere al menos tres parejas confirmadas.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {gruposCategoria.map((grupo) => {
                  const parejas =
                    standings?.filter(
                      (standing) => standing.group_id === grupo.id,
                    ) ?? [];

                  return (
                    <article
                      key={grupo.id}
                      className="border border-offwhite/10 bg-navy-light p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-display text-lg">{grupo.nombre}</h3>

                        <span className="text-xs text-offwhite/40">
                          {parejas.length}{" "}
                          {parejas.length === 1 ? "pareja" : "parejas"}
                        </span>
                      </div>

                      {parejas.length ? (
                        <ol className="divide-y divide-offwhite/10 border-y border-offwhite/10">
                          {parejas.map((standing, index) => {
                            const player1 = standing.pair?.player1;

                            const player2 = standing.pair?.player2;

                            return (
                              <li
                                key={`${grupo.id}-${index}`}
                                className="py-3 text-sm"
                              >
                                <span className="mr-3 text-xs text-offwhite/35">
                                  {index + 1}.
                                </span>

                                <span>
                                  {player1
                                    ? `${player1.nombre} ${player1.apellidos}`
                                    : "Jugador pendiente"}
                                </span>

                                {player2 ? (
                                  <>
                                    <span className="mx-2 text-offwhite/30">
                                      /
                                    </span>

                                    <span>
                                      {player2.nombre} {player2.apellidos}
                                    </span>
                                  </>
                                ) : null}
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className="text-sm text-offwhite/50">
                          No hay parejas asociadas a este grupo.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
