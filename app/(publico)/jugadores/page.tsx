import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { listarJugadoresListado } from "@/lib/jugadores/listado";

export const metadata: Metadata = { title: "Jugadores" };

type Props = {
  searchParams: Promise<{ q?: string; categoria?: string; nivel?: string }>;
};

const NIVELES_MINIMOS = [0, 5, 10, 20, 30, 40];

export default async function PaginaJugadores({ searchParams }: Props) {
  const sp = await searchParams;
  const todos = await listarJugadoresListado();

  const q = (sp.q ?? "").trim().toLowerCase();
  const categoria = (CATEGORIAS as readonly string[]).includes(sp.categoria ?? "")
    ? (sp.categoria as Categoria)
    : "";
  const nivelMin = Number(sp.nivel) || 0;

  const filtrados = todos.filter(
    (j) =>
      (!q || j.nombre.toLowerCase().includes(q)) &&
      (!categoria || j.categoria === categoria) &&
      j.nivel >= nivelMin
  );

  return (
    <main className="container space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="heading-font text-6xl">Jugadores</h1>
        <p className="text-lg text-muted">
          Jugadores del circuito con perfil público. Pulsa en uno para ver su historial.
        </p>
      </header>

      <form method="get" className="card grid gap-3 p-4 text-sm md:grid-cols-[1fr_200px_200px_auto] md:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-muted">Buscar por nombre</span>
          <input name="q" defaultValue={sp.q ?? ""} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted">Categoría</span>
          <select name="categoria" defaultValue={categoria}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ETIQUETAS_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted">Nivel mínimo</span>
          <select name="nivel" defaultValue={String(nivelMin)}>
            {NIVELES_MINIMOS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "Cualquiera" : `Nivel ${n}+`}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primario">
          Filtrar
        </button>
      </form>

      {filtrados.length === 0 ? (
        <p className="card p-6 text-sm text-muted">No hay jugadores con estos filtros.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((j) => (
            <li key={j.id}>
              <Link href={`/jugadores/${j.slug}`} className="card block h-full space-y-4 p-5 hover:border-navy">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="heading-font text-2xl leading-tight">{j.nombre}</p>
                    <p className="text-xs text-muted">
                      {j.categoria ? ETIQUETAS_CATEGORIA[j.categoria] : "Sin categoría"}
                    </p>
                  </div>
                  <span className="badge badge-marca">Nivel {j.nivel}</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-sage" style={{ width: `${Math.round(j.progreso * 100)}%` }} />
                </div>

                <dl className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <dt className="text-xs text-muted">Puntos</dt>
                    <dd className="font-semibold">{j.puntos}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Pruebas</dt>
                    <dd className="font-semibold">{j.pruebas}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">% victorias</dt>
                    <dd className="font-semibold">{j.porcentajeVictorias}%</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
