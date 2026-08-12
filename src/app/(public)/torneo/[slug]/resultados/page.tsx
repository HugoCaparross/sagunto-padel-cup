// Ruta: src/app/(public)/torneo/[slug]/resultados/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type MatchRow = {
  id: string;
  fase: string;
  tramo: string | null;
  estado: string;
  pista: string | null;
  hora_programada: string | null;
  fecha_modificacion: string | null;
  resultado_json: {
    ganador_id?: string;
    sets: {
      juegos_pair1: number;
      juegos_pair2: number;
    }[];
  } | null;
  categorias: {
    id?: string;
    nombre: string;
  } | null;
  pair1: {
    id?: string;
    player1: {
      id: string;
      nombre: string;
      apellidos: string;
    } | null;
    player2: {
      id: string;
      nombre: string;
      apellidos: string;
    } | null;
  } | null;
  pair2: {
    id?: string;
    player1: {
      id: string;
      nombre: string;
      apellidos: string;
    } | null;
    player2: {
      id: string;
      nombre: string;
      apellidos: string;
    } | null;
  } | null;
};

type SearchParams = {
  categoria?: string;
  fase?: string;
};

function nombrePareja(
  pareja: MatchRow["pair1"],
) {
  if (!pareja) {
    return "?";
  }

  const nombre1 =
    pareja.player1
      ? `${pareja.player1.nombre} ${pareja.player1.apellidos}`
      : "?";

  const nombre2 =
    pareja.player2
      ? ` / ${pareja.player2.nombre} ${pareja.player2.apellidos}`
      : "";

  return nombre1 + nombre2;
}

function ganadorNombre(
  partido: MatchRow,
) {
  const ganadorId =
    partido.resultado_json
      ?.ganador_id;

  if (
    ganadorId &&
    ganadorId ===
      partido.pair1?.id
  ) {
    return nombrePareja(
      partido.pair1,
    );
  }

  if (
    ganadorId &&
    ganadorId ===
      partido.pair2?.id
  ) {
    return nombrePareja(
      partido.pair2,
    );
  }

  return null;
}

function fechaVisible(
  partido: MatchRow,
) {
  const value =
    partido.hora_programada ??
    partido.fecha_modificacion;

  if (!value) {
    return "Fecha por confirmar";
  }

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default async function ResultadosPublicosPage({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } =
    await params;

  const filters =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: torneo,
  } = await supabase
    .from("tournaments")
    .select(
      "id, nombre",
    )
    .eq(
      "slug",
      slug,
    )
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const {
    data: categorias,
  } = await supabase
    .from(
      "tournament_categories",
    )
    .select(
      "categoria_id, categories(id, nombre)",
    )
    .eq(
      "tournament_id",
      torneo.id,
    );

  const {
    data: partidos,
  } = await supabase
    .from("matches")
    .select(
      "id, fase, tramo, estado, pista, hora_programada, fecha_modificacion, resultado_json, categorias:categories(id, nombre), pair1:pairs!matches_pair_1_id_fkey(id, player1:players!pairs_player_1_id_fkey(id, nombre, apellidos), player2:players!pairs_player_2_id_fkey(id, nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(id, player1:players!pairs_player_1_id_fkey(id, nombre, apellidos), player2:players!pairs_player_2_id_fkey(id, nombre, apellidos))",
    )
    .eq(
      "tournament_id",
      torneo.id,
    )
    .in(
      "estado",
      [
        "finalizado",
        "en_juego",
        "bloqueado",
        "aplazado",
      ],
    )
    .order(
      "fecha_modificacion",
      {
        ascending: false,
        nullsFirst: false,
      },
    )
    .returns<MatchRow[]>();

  const categoriaActiva =
    filters.categoria?.trim() ??
    "";

  const faseActiva =
    filters.fase?.trim() ??
    "";

  const resultados =
    (partidos ?? []).filter(
      (partido) => {
        if (
          categoriaActiva &&
          partido.categorias?.id !==
            categoriaActiva
        ) {
          return false;
        }

        if (
          faseActiva &&
          partido.fase !==
            faseActiva
        ) {
          return false;
        }

        return true;
      },
    );

  const fases =
    Array.from(
      new Set(
        (partidos ?? [])
          .map(
            (partido) =>
              partido.fase,
          )
          .filter(
            (
              fase,
            ): fase is string =>
              Boolean(fase),
          ),
      ),
    );

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">
          Resultados
        </h1>

        <p className="mt-2 text-navy/70">
          {torneo.nombre}
        </p>
      </header>

      <form className="mb-8 grid gap-4 rounded-card bg-navy/5 p-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="resultados-categoria"
            className="mb-1.5 block text-sm font-semibold"
          >
            Categoría
          </label>

          <select
            id="resultados-categoria"
            name="categoria"
            defaultValue={
              filters.categoria ??
              ""
            }
            className="w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              Todas
            </option>

            {categorias?.map(
              (categoria) => {
                const data =
                  categoria.categories as unknown as {
                    id: string;
                    nombre: string;
                  } | null;

                return data ? (
                  <option
                    key={
                      categoria.categoria_id
                    }
                    value={
                      data.id
                    }
                  >
                    {data.nombre}
                  </option>
                ) : null;
              },
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="resultados-fase"
            className="mb-1.5 block text-sm font-semibold"
          >
            Ronda
          </label>

          <select
            id="resultados-fase"
            name="fase"
            defaultValue={
              filters.fase ??
              ""
            }
            className="w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              Todas
            </option>

            {fases.map(
              (fase) => (
                <option
                  key={fase}
                  value={fase}
                >
                  {fase}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="btn-primary"
          >
            Aplicar filtros
          </button>

          <Link
            href={`/torneo/${slug}/resultados`}
            className="btn-secondary"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {!resultados.length ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          Aún no hay resultados
          publicados que coincidan con
          los filtros seleccionados.
        </section>
      ) : (
        <div className="space-y-3">
          {resultados.map(
            (partido) => {
              const ganador =
                ganadorNombre(
                  partido,
                );

              const pendiente =
                partido.estado !==
                "finalizado";

              return (
                <article
                  key={partido.id}
                  id={`partido-${partido.id}`}
                  className="card scroll-mt-28"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs uppercase text-sage">
                      {
                        partido
                          .categorias
                          ?.nombre
                      }
                      {" · "}
                      {partido.tramo
                        ? `${partido.tramo} · ${partido.fase}`
                        : "grupos"}
                    </p>

                    <span
                      className={`text-xs ${
                        pendiente
                          ? "text-coral"
                          : "text-navy/55"
                      }`}
                    >
                      {pendiente
                        ? partido.estado ===
                          "en_juego"
                          ? "En vivo"
                          : "Pendiente de confirmar"
                        : "Resultado confirmado"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div>
                      <p
                        className={
                          partido
                            .resultado_json
                            ?.ganador_id ===
                          partido
                            .pair1
                            ?.id
                            ? "font-semibold"
                            : ""
                        }
                      >
                        {nombrePareja(
                          partido.pair1,
                        )}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="font-display text-xl">
                        {partido
                          .resultado_json
                          ?.sets
                          ?.map(
                            (set) =>
                              `${set.juegos_pair1}-${set.juegos_pair2}`,
                          )
                          .join(
                            ", ",
                          ) ??
                          "—"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p
                        className={
                          partido
                            .resultado_json
                            ?.ganador_id ===
                          partido
                            .pair2
                            ?.id
                            ? "font-semibold"
                            : ""
                        }
                      >
                        {nombrePareja(
                          partido.pair2,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-navy/5 pt-3 text-xs text-navy/55">
                    <span>
                      {fechaVisible(
                        partido,
                      )}
                    </span>

                    <span>
                      {partido.pista ??
                        "Pista por confirmar"}
                    </span>

                    {ganador ? (
                      <span>
                        Ganador:{" "}
                        {ganador}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {partido.pair1?.player1?.id ? (
                      <Link
                        href={`/jugador/${partido.pair1.player1.id}`}
                        className="text-xs font-semibold text-coral underline underline-offset-4"
                      >
                        Ver jugador
                      </Link>
                    ) : null}

                    {partido.pair2?.player1?.id ? (
                      <Link
                        href={`/jugador/${partido.pair2.player1.id}`}
                        className="text-xs font-semibold text-coral underline underline-offset-4"
                      >
                        Ver jugador
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </main>
  );
}
