// Ruta: src/app/(public)/torneo/[slug]/horarios/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ESTADO_PARTIDO, formatearFechaHora } from "@/lib/estados";
import { Clock, MapPin } from "lucide-react";

type PlayerName = {
  nombre: string;
  apellidos: string;
} | null;

type MatchRow = {
  id: string;
  pista: string | null;
  hora_programada: string | null;
  estado: string;
  fase: string | null;
  pair_1_id: string | null;
  pair_2_id: string | null;
  categorias: {
    id?: string;
    nombre: string;
  } | null;
  pair1: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
  pair2: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
};

type SearchParams = {
  categoria?: string;
  dia?: string;
  pista?: string;
};

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) {
    return "Por determinar";
  }

  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";

  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";

  return n1 + n2;
}

function fechaDia(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function fechaDiaClave(value: string) {
  return value.slice(0, 10);
}

export default async function HorariosPage({
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
      "id, pista, hora_programada, estado, fase, pair_1_id, pair_2_id, categorias:categories(id, nombre), pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
    )
    .eq("tournament_id", torneo.id)
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .order("hora_programada", {
      ascending: true,
      nullsFirst: false,
    })
    .returns<MatchRow[]>();

  const categoriaActiva = filters.categoria?.trim() ?? "";

  const pistaActiva = filters.pista?.trim() ?? "";

  const diaActivo = filters.dia?.trim() ?? "";

  const partidosFiltrados = (partidos ?? []).filter((partido) => {
    const categoriaId = partido.categorias?.id ?? "";

    if (categoriaActiva && categoriaId !== categoriaActiva) {
      return false;
    }

    if (pistaActiva && partido.pista !== pistaActiva) {
      return false;
    }

    if (diaActivo) {
      if (
        !partido.hora_programada ||
        fechaDiaClave(partido.hora_programada) !== diaActivo
      ) {
        return false;
      }
    }

    return true;
  });

  const pistas = Array.from(
    new Set(
      (partidos ?? [])
        .map((partido) => partido.pista)
        .filter((pista): pista is string => Boolean(pista)),
    ),
  ).sort();

  const dias = Array.from(
    new Set(
      (partidos ?? [])
        .map((partido) => partido.hora_programada)
        .filter((value): value is string => Boolean(value))
        .map(fechaDiaClave),
    ),
  ).sort();

  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();

    const values = {
      categoria: overrides.categoria ?? filters.categoria ?? "",
      dia: overrides.dia ?? filters.dia ?? "",
      pista: overrides.pista ?? filters.pista ?? "",
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const query = params.toString();

    return query
      ? `/torneo/${slug}/horarios?${query}`
      : `/torneo/${slug}/horarios`;
  };

  const porDia = new Map<string, MatchRow[]>();

  partidosFiltrados.forEach((partido) => {
    const key = partido.hora_programada
      ? fechaDiaClave(partido.hora_programada)
      : "sin-fecha";

    if (!porDia.has(key)) {
      porDia.set(key, []);
    }

    porDia.get(key)!.push(partido);
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Horarios</h1>
        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      <form
        method="get"
        className="mb-8 grid gap-4 rounded-card bg-navy/5 p-4 md:grid-cols-3"
      >
        <div>
          <label
            htmlFor="horarios-categoria"
            className="mb-1.5 block text-sm font-semibold"
          >
            Categoría
          </label>
          <select
            id="horarios-categoria"
            name="categoria"
            defaultValue={filters.categoria ?? ""}
            className="w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {categorias?.map((categoria) => {
              const data = categoria.categories as unknown as {
                id: string;
                nombre: string;
              } | null;

              return data ? (
                <option key={categoria.categoria_id} value={data.id}>
                  {data.nombre}
                </option>
              ) : null;
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="horarios-dia"
            className="mb-1.5 block text-sm font-semibold"
          >
            Día
          </label>
          <select
            id="horarios-dia"
            name="dia"
            defaultValue={filters.dia ?? ""}
            className="w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {dias.map((dia) => (
              <option key={dia} value={dia}>
                {fechaDia(`${dia}T12:00:00`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="horarios-pista"
            className="mb-1.5 block text-sm font-semibold"
          >
            Pista
          </label>
          <select
            id="horarios-pista"
            name="pista"
            defaultValue={filters.pista ?? ""}
            className="w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {pistas.map((pista) => (
              <option key={pista} value={pista}>
                {pista}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 md:col-span-3">
          <button type="submit" className="btn-primary">
            Aplicar filtros
          </button>

          <Link href={`/torneo/${slug}/horarios`} className="btn-secondary">
            Limpiar
          </Link>
        </div>
      </form>

      {!partidos?.length ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          Los horarios aún no están publicados.
        </section>
      ) : !partidosFiltrados.length ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          No hay partidos que coincidan con los filtros seleccionados.
        </section>
      ) : (
        Array.from(porDia.entries()).map(([dia, lista]) => (
          <section key={dia} className="mb-8" aria-labelledby={`dia-${dia}`}>
            <h2
              id={`dia-${dia}`}
              className="mb-3 font-display text-xl capitalize"
            >
              {dia === "sin-fecha"
                ? "Fecha por confirmar"
                : fechaDia(`${dia}T12:00:00`)}
            </h2>

            <ul className="space-y-3">
              {lista.map((partido) => (
                <li
                  key={partido.id}
                  id={`partido-${partido.id}`}
                  className="card"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy/55">
                        <span className="uppercase text-sage">
                          {partido.categorias?.nombre}
                        </span>
                        <span>{partido.fase ?? "Partido"}</span>
                      </div>

                      <p className="font-semibold">
                        {nombrePareja(partido.pair1)}{" "}
                        <span className="text-navy/40">vs</span>{" "}
                        {nombrePareja(partido.pair2)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-navy/60">
                      <span className="flex items-center gap-1">
                        <Clock size={13} aria-hidden="true" />
                        {partido.hora_programada
                          ? new Date(
                              partido.hora_programada,
                            ).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Hora por confirmar"}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin size={13} aria-hidden="true" />
                        {partido.pista ?? "Pista por confirmar"}
                      </span>

                      <span>
                        {ESTADO_PARTIDO[partido.estado] ?? partido.estado}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/torneo/${slug}/resultados#partido-${partido.id}`}
                      className="text-xs font-semibold text-coral underline underline-offset-4"
                    >
                      Abrir resumen
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
