// Ruta: src/app/(public)/jugadores/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Jugadores",
  description: "Directorio público de jugadores de Sagunto Padel Cup.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function JugadoresPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const supabase = await createClient();

  const { data: jugadores } = await supabase
    .from("players")
    .select("id, nombre, apellidos, categoria_actual_id, categories(nombre)")
    .eq("estado", "activo")
    .order("nombre", { ascending: true })
    .order("apellidos", { ascending: true });

  const visibles = (jugadores ?? []).filter((jugador) => {
    if (!query) {
      return true;
    }

    const texto = `${jugador.nombre} ${jugador.apellidos}`.toLowerCase();

    return texto.includes(query.toLowerCase());
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
      <header className="mb-8 border-b border-navy/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/45">
          Directorio
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Jugadores</h1>
        <p className="mt-2 text-sm text-navy/65">
          Busca participantes y abre su perfil público para consultar su
          trayectoria competitiva.
        </p>
      </header>

      <form
        method="get"
        className="mb-8 flex flex-col gap-3 border-y border-navy/10 py-5 sm:flex-row"
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="jugadores-busqueda"
            className="mb-1.5 block text-sm font-semibold"
          >
            Buscar jugador
          </label>
          <input
            id="jugadores-busqueda"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Nombre o apellidos"
            className="input"
          />
        </div>
        <div className="flex items-end gap-3">
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          {query ? (
            <Link
              href="/jugadores"
              className="pb-3 text-sm font-semibold underline underline-offset-4"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      {!visibles.length ? (
        <div className="border border-dashed border-navy/15 px-5 py-10">
          <p className="font-semibold">
            {query
              ? "No hay jugadores que coincidan con la búsqueda."
              : "Aún no hay jugadores registrados."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-navy/10">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Directorio de jugadores</caption>
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-[0.08em] text-navy/50">
                <th scope="col" className="px-3 py-3">
                  Jugador
                </th>
                <th scope="col" className="px-3 py-3">
                  Categoría
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Perfil
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((jugador) => {
                const categoria = jugador.categories as unknown as {
                  nombre?: string;
                } | null;

                return (
                  <tr
                    key={jugador.id}
                    className="border-b border-navy/5 last:border-0"
                  >
                    <th scope="row" className="px-3 py-4 text-left font-medium">
                      {jugador.nombre} {jugador.apellidos}
                    </th>
                    <td className="px-3 py-4 text-navy/65">
                      {categoria?.nombre ?? "Sin categoría"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        href={`/jugador/${jugador.id}`}
                        className="font-semibold underline underline-offset-4"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
