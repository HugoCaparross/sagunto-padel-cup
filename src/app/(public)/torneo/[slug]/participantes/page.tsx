// Ruta: src/app/(public)/torneo/[slug]/participantes/page.tsx

import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const ESTADO_LABEL: Record<string, string> = {
  confirmada: "Confirmada",
  lista_espera: "Lista de espera",
  incompleta: "Falta compañero/a",
  pendiente_pago: "Pendiente de pago",
  cancelada: "Cancelada",
};

type SearchParams = {
  categoria?: string;
  q?: string;
};

type PairRow = {
  id: string;
  categoria_id: string;
  estado: string;
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
};

export default async function ParticipantesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
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
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  const { data: parejas } = await supabase
    .from("pairs")
    .select(
      "id, categoria_id, estado, player1:players!pairs_player_1_id_fkey(id, nombre, apellidos), player2:players!pairs_player_2_id_fkey(id, nombre, apellidos)",
    )
    .eq("tournament_id", torneo.id)
    .neq("estado", "cancelada")
    .returns<PairRow[]>();

  const query = filters.q?.trim().toLocaleLowerCase("es-ES") ?? "";
  const categoriaActiva = filters.categoria?.trim() ?? "";

  const parejasFiltradas = (parejas ?? []).filter((pareja) => {
    if (categoriaActiva && pareja.categoria_id !== categoriaActiva) {
      return false;
    }

    if (!query) {
      return true;
    }

    const nombres = [pareja.player1, pareja.player2]
      .filter(Boolean)
      .map((player) => `${player?.nombre ?? ""} ${player?.apellidos ?? ""}`)
      .join(" ")
      .toLocaleLowerCase("es-ES");

    return nombres.includes(query);
  });

  const buildHref = (categoria: string) => {
    const params = new URLSearchParams();

    params.set("categoria", categoria);

    if (filters.q?.trim()) {
      params.set("q", filters.q.trim());
    }

    return `/torneo/${slug}/participantes?${params.toString()}`;
  };

  const limpiarHref = `/torneo/${slug}/participantes`;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
      <header className="mb-8 border-b border-navy/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/45">
          Torneo
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold">
          Participantes
        </h1>

        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      <form
        method="get"
        className="mb-8 grid gap-4 border-y border-navy/10 py-5 sm:grid-cols-[1fr_auto]"
      >
        <div>
          <label
            htmlFor="buscar-participantes"
            className="mb-1.5 block text-sm font-semibold"
          >
            Buscar jugador
          </label>

          <input
            id="buscar-participantes"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Nombre o apellidos"
            className="input"
          />
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            Buscar
          </button>

          <Link href={limpiarHref} className="btn-secondary">
            Limpiar
          </Link>
        </div>
      </form>

      {categorias?.length ? (
        <nav
          aria-label="Filtrar por categoría"
          className="mb-8 overflow-x-auto"
        >
          <div className="flex min-w-max gap-2">
            <Link
              href={
                filters.q?.trim()
                  ? `${limpiarHref}?q=${encodeURIComponent(filters.q.trim())}`
                  : limpiarHref
              }
              className={`rounded-full px-3 py-2 text-sm ${
                !categoriaActiva
                  ? "bg-navy text-offwhite"
                  : "bg-navy/5 text-navy/70"
              }`}
            >
              Todas
            </Link>

            {categorias.map((categoria) => (
              <Link
                key={categoria.id}
                href={buildHref(categoria.id)}
                className={`rounded-full px-3 py-2 text-sm ${
                  categoriaActiva === categoria.id
                    ? "bg-navy text-offwhite"
                    : "bg-navy/5 text-navy/70"
                }`}
              >
                {categoria.nombre}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {parejasFiltradas.length ? (
        <div className="space-y-8">
          {categorias
            ?.filter(
              (categoria) =>
                !categoriaActiva || categoria.id === categoriaActiva,
            )
            .map((categoria) => {
              const deLaCategoria = parejasFiltradas.filter(
                (pareja) => pareja.categoria_id === categoria.id,
              );

              if (!deLaCategoria.length) {
                return null;
              }

              return (
                <section
                  key={categoria.id}
                  aria-labelledby={`categoria-${categoria.id}`}
                >
                  <h2
                    id={`categoria-${categoria.id}`}
                    className="mb-3 font-display text-xl"
                  >
                    {categoria.nombre}
                  </h2>

                  <ul className="space-y-2">
                    {deLaCategoria.map((pareja) => {
                      const jugadores = [pareja.player1, pareja.player2].filter(
                        Boolean,
                      );

                      return (
                        <li
                          key={pareja.id}
                          className="border-b border-navy/10 px-1 py-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold">
                                {jugadores
                                  .map((jugador) => (
                                    <span key={jugador?.id}>
                                      {jugador?.id ? (
                                        <Link
                                          href={`/jugador/${jugador.id}`}
                                          className="underline decoration-transparent underline-offset-4 hover:text-coral hover:decoration-coral"
                                        >
                                          {jugador?.nombre} {jugador?.apellidos}
                                        </Link>
                                      ) : null}
                                    </span>
                                  ))
                                  .reduce(
                                    (resultado, elemento, index) =>
                                      index === 0
                                        ? [elemento]
                                        : [
                                            ...resultado,
                                            <span
                                              key={`sep-${index}`}
                                              className="text-navy/40"
                                            >
                                              {" "}
                                              /{" "}
                                            </span>,
                                            elemento,
                                          ],
                                    [] as ReactNode[],
                                  )}
                              </p>

                              {!pareja.player2 ? (
                                <p className="mt-1 text-xs text-navy/55">
                                  Pendiente de compañero/a
                                </p>
                              ) : null}
                            </div>

                            <span
                              className={`shrink-0 text-xs ${
                                pareja.estado === "lista_espera"
                                  ? "text-coral"
                                  : "text-navy/60"
                              }`}
                            >
                              {ESTADO_LABEL[pareja.estado]}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
        </div>
      ) : (
        <section
          role="status"
          className="border border-dashed border-navy/15 p-6 text-sm text-navy/70"
        >
          {parejas?.length
            ? "No hay participantes que coincidan con los filtros seleccionados."
            : "Aún no hay participantes confirmados para este torneo."}
        </section>
      )}
    </main>
  );
}
