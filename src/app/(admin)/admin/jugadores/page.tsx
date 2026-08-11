// Ruta: src/app/(admin)/admin/jugadores/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import JugadoresTable from "@/components/admin/JugadoresTable";

export const dynamic = "force-dynamic";

export default async function AdminJugadoresPage() {
  const admin = createAdminClient();

  const [
    { data: jugadores, error: jugadoresError },
    { data: categorias, error: categoriasError },
    { data: puntos, error: puntosError },
  ] = await Promise.all([
    admin
      .from("players")
      .select("id, nombre, apellidos, categoria_actual_id, estado")
      .order("nombre")
      .order("apellidos"),

    admin.from("categories").select("id, nombre").order("nivel_orden"),

    admin.from("ranking_points").select("player_id, puntos_obtenidos"),
  ]);

  const hasError =
    Boolean(jugadoresError) || Boolean(categoriasError) || Boolean(puntosError);

  if (hasError) {
    console.error("[admin/jugadores] Error cargando datos:", {
      jugadoresError,
      categoriasError,
      puntosError,
    });
  }

  const puntosPorJugador = new Map<string, number>();

  for (const punto of puntos ?? []) {
    const actual = puntosPorJugador.get(punto.player_id) ?? 0;

    puntosPorJugador.set(
      punto.player_id,
      actual + Number(punto.puntos_obtenidos ?? 0),
    );
  }

  const jugadoresConPuntos = (jugadores ?? []).map((jugador) => ({
    ...jugador,
    puntos: puntosPorJugador.get(jugador.id) ?? 0,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración
        </p>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Jugadores
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-offwhite/60">
              Directorio operativo de jugadores, categorías, estado y
              rendimiento competitivo.
            </p>
          </div>

          <p className="text-sm text-offwhite/45">
            {jugadoresConPuntos.length}{" "}
            {jugadoresConPuntos.length === 1 ? "jugador" : "jugadores"}
          </p>
        </div>
      </header>

      {hasError ? (
        <section
          role="alert"
          className="border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar todos los datos
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/65">
            Algunos datos de jugadores no están disponibles ahora mismo.
            Inténtalo de nuevo.
          </p>
        </section>
      ) : jugadoresConPuntos.length === 0 ? (
        <section className="border border-dashed border-offwhite/15 px-5 py-10">
          <h2 className="text-sm font-semibold">
            No hay jugadores registrados
          </h2>

          <p className="mt-1 text-sm text-offwhite/55">
            Los jugadores aparecerán aquí cuando exista información disponible.
          </p>
        </section>
      ) : (
        <JugadoresTable
          jugadoresIniciales={jugadoresConPuntos}
          categorias={categorias ?? []}
        />
      )}
    </main>
  );
}
