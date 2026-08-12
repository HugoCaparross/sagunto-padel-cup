// Ruta: src/app/(public)/jugador/[id]/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function JugadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: jugador } = await supabase
    .from("players")
    .select(
      "id, nombre, apellidos, ciudad, mano_dominante, pala, instagram, categoria_actual_id, categories(nombre), visibilidad_json",
    )
    .eq("id", id)
    .eq("estado", "activo")
    .maybeSingle();

  if (!jugador) {
    notFound();
  }

  const [{ data: puntos }, { data: historial }, { data: badges }] =
    await Promise.all([
      supabase
        .from("ranking_points")
        .select("puntos_obtenidos, tournament_id")
        .eq("player_id", id)
        .gte("fecha_caducidad", hoy),
      supabase
        .from("ranking_points")
        .select("ronda_alcanzada, puntos_obtenidos, fecha, tournaments(nombre)")
        .eq("player_id", id)
        .order("fecha", { ascending: false }),
      supabase.from("badges").select("tipo").eq("player_id", id),
    ]);

  const totalPuntos =
    puntos?.reduce(
      (sum, punto) => sum + (Number(punto.puntos_obtenidos) || 0),
      0,
    ) ?? 0;

  const torneosJugados = new Set(
    (puntos ?? [])
      .map((punto) => punto.tournament_id)
      .filter((tournamentId) => Boolean(tournamentId)),
  ).size;

  const rankingPlayers = jugador.categoria_actual_id
    ? await supabase
        .from("ranking_points")
        .select(
          "player_id, puntos_obtenidos, players!inner(estado, categoria_actual_id)",
        )
        .gte("fecha_caducidad", hoy)
        .eq("players.estado", "activo")
        .eq("players.categoria_actual_id", jugador.categoria_actual_id)
    : { data: [] };

  const acumulado = new Map<string, number>();

  (rankingPlayers.data ?? []).forEach((row) => {
    const actual = acumulado.get(row.player_id) ?? 0;
    acumulado.set(row.player_id, actual + (Number(row.puntos_obtenidos) || 0));
  });

  const rankingOrdenado = Array.from(acumulado.entries()).sort(
    ([, puntosA], [, puntosB]) => puntosB - puntosA,
  );

  const posicion =
    rankingOrdenado.findIndex(([playerId]) => playerId === id) + 1;

  const vis = (jugador.visibilidad_json ?? {}) as Record<string, boolean>;

  const categoria = jugador.categories as unknown as {
    nombre?: string;
  } | null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:py-14">
      <header className="border-b border-navy/10 pb-6">
        <p className="text-sm text-navy/55">Perfil público de jugador</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">
          {jugador.nombre} {jugador.apellidos}
        </h1>
        <p className="mt-2 text-navy/70">
          {categoria?.nombre ?? "Categoría no disponible"}
        </p>
      </header>

      <section
        aria-label="Resumen competitivo"
        className="grid gap-px border-y border-navy/10 bg-navy/10 sm:grid-cols-3"
      >
        <div className="bg-offwhite p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-navy/50">
            Posición
          </p>
          <p className="mt-1 font-display text-3xl">
            {posicion > 0 ? `#${posicion}` : "—"}
          </p>
        </div>
        <div className="bg-offwhite p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-navy/50">
            Puntos
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">
            {totalPuntos}
          </p>
        </div>
        <div className="bg-offwhite p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-navy/50">
            Pruebas
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">
            {torneosJugados}
          </p>
        </div>
      </section>

      {(vis.ciudad && jugador.ciudad) ||
      (vis.mano_dominante && jugador.mano_dominante) ||
      (vis.pala && jugador.pala) ||
      (vis.instagram && jugador.instagram) ? (
        <section className="mt-8" aria-labelledby="datos-publicos-title">
          <h2 id="datos-publicos-title" className="font-display text-xl">
            Datos públicos
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {vis.ciudad && jugador.ciudad ? (
              <div className="border-b border-navy/10 pb-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-navy/45">
                  Ciudad
                </dt>
                <dd className="mt-1 text-sm">{jugador.ciudad}</dd>
              </div>
            ) : null}
            {vis.mano_dominante && jugador.mano_dominante ? (
              <div className="border-b border-navy/10 pb-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-navy/45">
                  Mano dominante
                </dt>
                <dd className="mt-1 text-sm">{jugador.mano_dominante}</dd>
              </div>
            ) : null}
            {vis.pala && jugador.pala ? (
              <div className="border-b border-navy/10 pb-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-navy/45">
                  Pala
                </dt>
                <dd className="mt-1 text-sm">{jugador.pala}</dd>
              </div>
            ) : null}
            {vis.instagram && jugador.instagram ? (
              <div className="border-b border-navy/10 pb-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-navy/45">
                  Instagram
                </dt>
                <dd className="mt-1 text-sm">@{jugador.instagram}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {badges?.length ? (
        <section className="mt-8" aria-labelledby="insignias-title">
          <h2 id="insignias-title" className="font-display text-xl">
            Insignias
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <li
                key={badge.tipo}
                className="rounded-full border border-navy/10 px-3 py-1.5 text-sm"
              >
                {badge.tipo.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="historial-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="historial-title" className="font-display text-xl">
              Historial competitivo
            </h2>
            <p className="mt-1 text-sm text-navy/55">
              Resultados y puntos registrados en el circuito.
            </p>
          </div>
          <Link
            href="/ranking"
            className="shrink-0 text-sm font-semibold underline underline-offset-4"
          >
            Ver ranking
          </Link>
        </div>

        {historial?.length ? (
          <div className="mt-4 overflow-x-auto border-y border-navy/10">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-[0.08em] text-navy/50">
                  <th scope="col" className="px-3 py-3">
                    Prueba
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Resultado
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Puntos
                  </th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item, index) => {
                  const torneo = item.tournaments as unknown as {
                    nombre?: string;
                  } | null;

                  return (
                    <tr
                      key={`${item.fecha}-${index}`}
                      className="border-b border-navy/5 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-3 py-4 text-left font-medium"
                      >
                        {torneo?.nombre ?? "Prueba"}
                      </th>
                      <td className="px-3 py-4 text-navy/65">
                        {item.ronda_alcanzada?.replace(/_/g, " ") ??
                          "Resultado no disponible"}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold tabular-nums">
                        {item.puntos_obtenidos} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-navy/65">
            Aún no tiene torneos disputados.
          </p>
        )}
      </section>
    </main>
  );
}
