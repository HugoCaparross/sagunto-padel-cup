// Ruta: src/app/(public)/torneo/[slug]/cuadros/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PlayerName = {
  id: string;
  nombre: string;
  apellidos: string;
} | null;

type MatchRow = {
  id: string;
  fase: string;
  tramo: string | null;
  categoria_id: string;
  estado: string;
  resultado_json: {
    ganador_id?: string;
    sets?: {
      juegos_pair1: number;
      juegos_pair2: number;
    }[];
  } | null;
  pair1: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
  pair2: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
  pair_1_id: string | null;
  pair_2_id: string | null;
};

type SearchParams = {
  categoria?: string;
  tramo?: string;
};

const ORDEN_FASE = ["octavos", "cuartos", "semis", "final"];

const FASE_LABEL: Record<string, string> = {
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semifinales",
  final: "Final",
};

const TRAMOS = ["oro", "plata", "bronce"] as const;

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) {
    return "Por determinar";
  }

  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";

  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";

  return n1 + n2;
}

function marcador(partido: MatchRow) {
  return (
    partido.resultado_json?.sets
      ?.map((set) => `${set.juegos_pair1}-${set.juegos_pair2}`)
      .join(", ") ?? null
  );
}

export default async function CuadrosPublicosPage({
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

  const { data: categorias } = await supabase
    .from("tournament_categories")
    .select("categoria_id, categories(id, nombre)")
    .eq("tournament_id", torneo.id);

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, fase, tramo, categoria_id, estado, resultado_json, pair_1_id, pair_2_id, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(id, nombre, apellidos), player2:players!pairs_player_2_id_fkey(id, nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(id, nombre, apellidos), player2:players!pairs_player_2_id_fkey(id, nombre, apellidos))",
    )
    .eq("tournament_id", torneo.id)
    .not("tramo", "is", null)
    .returns<MatchRow[]>();

  const categoriaActiva = filters.categoria?.trim() ?? "";

  const tramoActivo = filters.tramo?.trim() ?? "";

  const partidosFiltrados = (partidos ?? []).filter(
    (partido) =>
      (!categoriaActiva || partido.categoria_id === categoriaActiva) &&
      (!tramoActivo || partido.tramo === tramoActivo),
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
      <header className="mb-8 border-b border-navy/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/45">
          Competición
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Cuadros</h1>
        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      <div className="mb-8 overflow-x-auto">
        <nav
          aria-label="Filtrar cuadros por categoría"
          className="flex min-w-max gap-2"
        >
          <Link
            href={`/torneo/${slug}/cuadros${
              tramoActivo ? `?tramo=${encodeURIComponent(tramoActivo)}` : ""
            }`}
            className={`rounded-full px-3 py-2 text-sm ${
              !categoriaActiva
                ? "bg-navy text-offwhite"
                : "bg-navy/5 text-navy/70"
            }`}
          >
            Todas
          </Link>

          {categorias?.map((categoria) => {
            const data = categoria.categories as unknown as {
              id: string;
              nombre: string;
            } | null;

            if (!data) {
              return null;
            }

            const params = new URLSearchParams();

            params.set("categoria", categoria.categoria_id);

            if (tramoActivo) {
              params.set("tramo", tramoActivo);
            }

            return (
              <Link
                key={categoria.categoria_id}
                href={`/torneo/${slug}/cuadros?${params.toString()}`}
                className={`rounded-full px-3 py-2 text-sm ${
                  categoriaActiva === categoria.categoria_id
                    ? "bg-navy text-offwhite"
                    : "bg-navy/5 text-navy/70"
                }`}
              >
                {data.nombre}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={`/torneo/${slug}/cuadros${
            categoriaActiva
              ? `?categoria=${encodeURIComponent(categoriaActiva)}`
              : ""
          }`}
          className={`rounded-full px-3 py-2 text-sm ${
            !tramoActivo ? "bg-navy text-offwhite" : "bg-navy/5 text-navy/70"
          }`}
        >
          Todos los tramos
        </Link>

        {TRAMOS.map((tramo) => {
          const params = new URLSearchParams();

          if (categoriaActiva) {
            params.set("categoria", categoriaActiva);
          }

          params.set("tramo", tramo);

          return (
            <Link
              key={tramo}
              href={`/torneo/${slug}/cuadros?${params.toString()}`}
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

      {!partidosFiltrados.length ? (
        <section
          role="status"
          className="border border-dashed border-navy/15 p-6 text-sm text-navy/70"
        >
          El cuadro todavía no se ha generado o no hay partidos que coincidan
          con el filtro.
        </section>
      ) : (
        <div className="space-y-10">
          {(categorias ?? [])
            .filter(
              (categoria) =>
                !categoriaActiva || categoria.categoria_id === categoriaActiva,
            )
            .map((categoria) => {
              const categoriaData = categoria.categories as unknown as {
                nombre: string;
              } | null;

              if (!categoriaData) {
                return null;
              }

              const partidosCategoria = partidosFiltrados.filter(
                (partido) => partido.categoria_id === categoria.categoria_id,
              );

              if (!partidosCategoria.length) {
                return null;
              }

              return (
                <section
                  key={categoria.categoria_id}
                  aria-labelledby={`cuadro-${categoria.categoria_id}`}
                >
                  <h2
                    id={`cuadro-${categoria.categoria_id}`}
                    className="mb-4 font-display text-2xl"
                  >
                    {categoriaData.nombre}
                  </h2>

                  {TRAMOS.filter(
                    (tramo) => !tramoActivo || tramoActivo === tramo,
                  ).map((tramo) => {
                    const delTramo = partidosCategoria
                      .filter((partido) => partido.tramo === tramo)
                      .sort(
                        (a, b) =>
                          ORDEN_FASE.indexOf(a.fase) -
                          ORDEN_FASE.indexOf(b.fase),
                      );

                    if (!delTramo.length) {
                      return null;
                    }

                    return (
                      <div key={tramo} className="mb-6">
                        <h3 className="mb-3 font-semibold capitalize">
                          {tramo}
                        </h3>

                        <div className="overflow-x-auto pb-2">
                          <div className="grid min-w-[820px] grid-cols-4 gap-3">
                            {ORDEN_FASE.map((fase) => {
                              const fasePartidos = delTramo.filter(
                                (partido) => partido.fase === fase,
                              );

                              return (
                                <section
                                  key={fase}
                                  aria-labelledby={`fase-${categoria.categoria_id}-${tramo}-${fase}`}
                                  className="min-w-0"
                                >
                                  <h4
                                    id={`fase-${categoria.categoria_id}-${tramo}-${fase}`}
                                    className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/50"
                                  >
                                    {FASE_LABEL[fase]}
                                  </h4>

                                  <div className="space-y-3">
                                    {fasePartidos.length ? (
                                      fasePartidos.map((partido) => {
                                        const ganadorId =
                                          partido.resultado_json?.ganador_id;

                                        const score = marcador(partido);

                                        return (
                                          <article
                                            key={partido.id}
                                            id={`partido-${partido.id}`}
                                            className="rounded-card border border-navy/10 bg-white p-3"
                                          >
                                            <div className="space-y-2 text-sm">
                                              <Link
                                                href={`/torneo/${slug}/resultados#partido-${partido.id}`}
                                                className={`block ${
                                                  ganadorId ===
                                                  partido.pair_1_id
                                                    ? "font-semibold"
                                                    : ""
                                                } hover:text-coral`}
                                              >
                                                {nombrePareja(partido.pair1)}
                                              </Link>

                                              <div className="flex items-center justify-between gap-2 border-y border-navy/5 py-1.5">
                                                <span className="text-[10px] uppercase tracking-wide text-navy/40">
                                                  {partido.estado ===
                                                  "finalizado"
                                                    ? "Finalizado"
                                                    : "Por jugar"}
                                                </span>
                                                {score ? (
                                                  <span className="font-semibold">
                                                    {score}
                                                  </span>
                                                ) : null}
                                              </div>

                                              <Link
                                                href={`/torneo/${slug}/resultados#partido-${partido.id}`}
                                                className={`block ${
                                                  ganadorId ===
                                                  partido.pair_2_id
                                                    ? "font-semibold"
                                                    : ""
                                                } hover:text-coral`}
                                              >
                                                {partido.pair_2_id
                                                  ? nombrePareja(partido.pair2)
                                                  : "Bye"}
                                              </Link>
                                            </div>
                                          </article>
                                        );
                                      })
                                    ) : (
                                      <div className="rounded-card border border-dashed border-navy/15 p-3 text-xs text-navy/45">
                                        Sin partidos publicados.
                                      </div>
                                    )}
                                  </div>
                                </section>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </div>
      )}
    </main>
  );
}
