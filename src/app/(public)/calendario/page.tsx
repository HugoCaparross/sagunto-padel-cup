// Ruta: src/app/(public)/calendario/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_TORNEO,
  ESTADO_TORNEO_BADGE,
  formatearFecha,
} from "@/lib/estados";
import StatusBadge from "@/components/StatusBadge";

export const metadata = {
  title: "Calendario",
  description:
    "Consulta las pruebas del calendario de Sagunto Padel Cup, sus fechas, categorías y estado de inscripción.",
};

type SearchParams = {
  estado?: string;
  categoria?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const ESTADOS_VISIBLES = [
  "publicado",
  "inscripciones_abiertas",
  "inscripciones_cerradas",
  "en_preparacion",
  "en_juego",
  "finalizado",
  "cancelado",
  "archivado",
] as const;

export default async function CalendarioPage({ searchParams }: Props) {
  const filters = await searchParams;
  const estadoActivo = filters.estado ?? "todos";
  const categoriaActiva = filters.categoria?.trim().toLowerCase() ?? "";

  const supabase = await createClient();

  const [{ data: torneos }, { data: categorias }] = await Promise.all([
    supabase
      .from("tournaments")
      .select(
        "id, nombre, slug, estado, fecha_inicio, fecha_fin, club_id, clubs(nombre), tournament_categories(categories(id, nombre), cupo_maximo)",
      )
      .neq("estado", "borrador")
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("categories")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
  ]);

  const torneosFiltrados = (torneos ?? []).filter((torneo) => {
    if (
      estadoActivo !== "todos" &&
      !ESTADOS_VISIBLES.includes(
        estadoActivo as (typeof ESTADOS_VISIBLES)[number],
      )
    ) {
      return false;
    }

    if (estadoActivo !== "todos" && torneo.estado !== estadoActivo) {
      return false;
    }

    if (!categoriaActiva) {
      return true;
    }

    return (torneo.tournament_categories ?? []).some((item) => {
      const category = item.categories as unknown as {
        id?: string;
        nombre?: string;
      } | null;

      return (
        category?.id === filters.categoria ||
        category?.nombre?.trim().toLowerCase() === categoriaActiva
      );
    });
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Calendario</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          Todas las pruebas de la temporada, con su estado, categorías y acceso
          directo a la información del torneo.
        </p>
      </header>

      <form
        method="get"
        className="mb-8 grid gap-4 rounded-card border border-navy/10 p-4 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="calendario-estado"
            className="mb-1.5 block text-sm font-semibold"
          >
            Estado
          </label>
          <select
            id="calendario-estado"
            name="estado"
            defaultValue={estadoActivo}
            className="w-full rounded-card border border-navy/20 bg-offwhite px-3 py-2.5"
          >
            <option value="todos">Todos</option>
            {ESTADOS_VISIBLES.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_TORNEO[estado] ?? estado}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="calendario-categoria"
            className="mb-1.5 block text-sm font-semibold"
          >
            Categoría
          </label>
          <select
            id="calendario-categoria"
            name="categoria"
            defaultValue={filters.categoria ?? ""}
            className="w-full rounded-card border border-navy/20 bg-offwhite px-3 py-2.5"
          >
            <option value="">Todas</option>
            {(categorias ?? []).map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-card bg-coral px-4 py-2.5 font-semibold text-offwhite"
          >
            Aplicar filtros
          </button>
          {estadoActivo !== "todos" || categoriaActiva ? (
            <Link
              href="/calendario"
              className="text-sm font-semibold underline underline-offset-4"
            >
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      </form>

      {!torneosFiltrados.length ? (
        <div className="border border-dashed border-navy/15 px-5 py-10">
          <p className="font-semibold">No hay pruebas para estos filtros.</p>
          <p className="mt-1 text-sm text-navy/60">
            Prueba a cambiar la categoría o el estado seleccionado.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-navy/10 border-y border-navy/10">
          {torneosFiltrados.map((torneo) => {
            const club = torneo.clubs as unknown as {
              nombre?: string;
            } | null;

            const categoriasTorneo = (torneo.tournament_categories ?? [])
              .map((item) => {
                const category = item.categories as unknown as {
                  nombre?: string;
                } | null;

                return category?.nombre;
              })
              .filter((nombre): nombre is string => Boolean(nombre));

            const cupoTotal = (torneo.tournament_categories ?? []).reduce(
              (total, item) => total + (Number(item.cupo_maximo) || 0),
              0,
            );

            const badgeTipo = ESTADO_TORNEO_BADGE[torneo.estado] ?? "pending";

            return (
              <li key={torneo.id} className="py-5">
                <Link
                  href={`/torneo/${torneo.slug}`}
                  className="block rounded-card px-2 py-2 transition hover:bg-navy/5 focus:outline-none focus:ring-2 focus:ring-coral"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl">{torneo.nombre}</h2>
                      <p className="mt-1 text-sm text-navy/65">
                        {formatearFecha(torneo.fecha_inicio)}
                        {torneo.fecha_fin &&
                        torneo.fecha_fin !== torneo.fecha_inicio
                          ? ` — ${formatearFecha(torneo.fecha_fin)}`
                          : ""}
                      </p>
                      {club?.nombre ? (
                        <p className="mt-2 text-sm font-medium">
                          {club.nombre}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-navy/55">
                        {categoriasTorneo.length ? (
                          <span>{categoriasTorneo.join(" · ")}</span>
                        ) : (
                          <span>Categorías por confirmar</span>
                        )}
                        {cupoTotal > 0 ? (
                          <span>Hasta {cupoTotal} plazas</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge
                        texto={ESTADO_TORNEO[torneo.estado] ?? torneo.estado}
                        tipo={badgeTipo}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
