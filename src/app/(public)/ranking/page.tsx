// Ruta: src/app/(public)/ranking/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ranking",
  description:
    "Ranking individual de Sagunto Padel Cup con puntos móviles de los últimos 365 días.",
};

type Props = {
  searchParams: Promise<{
    categoria?: string;
    q?: string;
  }>;
};

type PuntoRow = {
  player_id: string;
  puntos_obtenidos: number;
  players: {
    nombre: string;
    apellidos: string;
    categoria_actual_id: string | null;
  } | null;
};

export default async function RankingPage({ searchParams }: Props) {
  const params = await searchParams;
  const categoria = params.categoria ?? "";
  const query = params.q?.trim().toLowerCase() ?? "";
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: categorias }, { data: puntos }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    supabase
      .from("ranking_points")
      .select(
        "player_id, puntos_obtenidos, players(nombre, apellidos, categoria_actual_id)",
      )
      .gte("fecha_caducidad", hoy)
      .returns<PuntoRow[]>(),
  ]);

  const acumulado = new Map<
    string,
    {
      nombre: string;
      puntos: number;
      categoriaId: string | null;
    }
  >();

  puntos?.forEach((punto) => {
    if (!punto.players) {
      return;
    }

    if (categoria && punto.players.categoria_actual_id !== categoria) {
      return;
    }

    const nombre = `${punto.players.nombre} ${punto.players.apellidos}`;
    const actual = acumulado.get(punto.player_id);

    if (actual) {
      actual.puntos += Number(punto.puntos_obtenidos) || 0;
    } else {
      acumulado.set(punto.player_id, {
        nombre,
        puntos: Number(punto.puntos_obtenidos) || 0,
        categoriaId: punto.players.categoria_actual_id,
      });
    }
  });

  const ranking = Array.from(acumulado.entries())
    .map(([playerId, value]) => ({
      playerId,
      ...value,
    }))
    .filter((item) => !query || item.nombre.toLowerCase().includes(query))
    .sort((a, b) => {
      if (b.puntos !== a.puntos) {
        return b.puntos - a.puntos;
      }

      return a.nombre.localeCompare(b.nombre, "es");
    });

  const categoriaSeleccionada = (categorias ?? []).find(
    (item) => item.id === categoria,
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Ranking</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">
          Clasificación individual derivada de los resultados y puntos vigentes
          dentro de la ventana móvil de 365 días.
        </p>
      </header>

      <form
        method="get"
        className="mb-8 grid gap-4 rounded-card border border-navy/10 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="ranking-categoria"
            className="mb-1.5 block text-sm font-semibold"
          >
            Categoría
          </label>
          <select
            id="ranking-categoria"
            name="categoria"
            defaultValue={categoria}
            className="w-full rounded-card border border-navy/20 bg-offwhite px-3 py-2.5"
          >
            <option value="">Todas</option>
            {(categorias ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="ranking-busqueda"
            className="mb-1.5 block text-sm font-semibold"
          >
            Buscar jugador
          </label>
          <input
            id="ranking-busqueda"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Nombre o apellidos"
            className="w-full rounded-card border border-navy/20 bg-offwhite px-3 py-2.5"
          />
        </div>

        <button
          type="submit"
          className="rounded-card bg-coral px-5 py-2.5 font-semibold text-offwhite"
        >
          Filtrar
        </button>
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/60">
          {categoriaSeleccionada
            ? `Categoría: ${categoriaSeleccionada.nombre}`
            : "Todas las categorías"}
        </p>
        <div className="flex gap-4 text-sm">
          <Link
            href="/ranking/race-to-master"
            className="font-semibold underline underline-offset-4"
          >
            Race to Master
          </Link>
          <Link
            href="/ranking/historico"
            className="font-semibold underline underline-offset-4"
          >
            Histórico
          </Link>
        </div>
      </div>

      {!ranking.length ? (
        <div className="border border-dashed border-navy/15 px-5 py-10">
          <p className="font-semibold">
            {query
              ? "No hay jugadores que coincidan con la búsqueda."
              : "Todavía no hay datos de ranking para este filtro."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-navy/10">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Ranking individual</caption>
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-[0.08em] text-navy/50">
                <th scope="col" className="px-3 py-3">
                  Posición
                </th>
                <th scope="col" className="px-3 py-3">
                  Jugador
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, index) => (
                <tr
                  key={item.playerId}
                  className="border-b border-navy/5 last:border-0"
                >
                  <th
                    scope="row"
                    className="px-3 py-4 text-left font-display tabular-nums"
                  >
                    #{index + 1}
                  </th>
                  <td className="px-3 py-4">
                    <Link
                      href={`/jugador/${item.playerId}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {item.nombre}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-right font-semibold tabular-nums">
                    {item.puntos} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
