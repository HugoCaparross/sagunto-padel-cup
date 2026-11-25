import Boton from "@/components/ui/Boton";
import type { Metadata } from "next";
import PanelPropuestas from "@/components/ranking/PanelPropuestas";
import FormPlazas from "@/components/ranking/FormPlazas";
import TablaRankingAdmin from "@/components/ranking/TablaRankingAdmin";
import {
  cargarHistorialRanking,
  cargarPropuestas,
  cargarRankingAdmin,
  cargarTemporadas,
  type FilaRankingAdmin,
} from "@/lib/ranking/admin-datos";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import { hoyEnMadrid } from "@/lib/ranking/cargar";

export const metadata: Metadata = { title: "Ranking · Admin" };

type Props = {
  searchParams: Promise<{ categoria?: string; referencia?: string; temporada?: string }>;
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const ETIQUETA_ACCION: Record<string, string> = {
  generar_propuestas: "Propuestas generadas",
  confirmar_propuesta: "Propuesta confirmada",
  modificar_propuesta: "Propuesta modificada",
  cambiar_plazas_temporada: "Plazas cambiadas",
};

// Marca las zonas de ascenso y descenso según las plazas de la temporada.
// Es una vista previa: la propuesta generada es la que aplica las reglas de empate.
function marcasDe(
  filas: FilaRankingAdmin[],
  categoria: Categoria,
  ascenso: number,
  descenso: number
): Record<string, "ascenso" | "descenso"> {
  const marcas: Record<string, "ascenso" | "descenso"> = {};
  const total = filas.length;

  for (const f of filas) {
    if (categoria !== "primera" && f.posicion <= ascenso) {
      marcas[f.clave] = "ascenso";
    } else if (categoria !== "cuarta" && descenso > 0 && f.posicion > total - descenso) {
      marcas[f.clave] = "descenso";
    }
  }
  return marcas;
}

export default async function PaginaRankingAdmin({ searchParams }: Props) {
  const sp = await searchParams;

  const categoria = (CATEGORIAS as readonly string[]).includes(sp.categoria ?? "")
    ? (sp.categoria as Categoria)
    : "segunda";
  const referencia = sp.referencia && FECHA.test(sp.referencia) ? sp.referencia : hoyEnMadrid();

  const temporadas = await cargarTemporadas();
  const seleccionada =
    temporadas.find((t) => String(t.id) === sp.temporada) ??
    temporadas.find((t) => t.activa) ??
    temporadas[0];

  if (!seleccionada) {
    return (
      <p className="text-[var(--color-danger)]">
        No hay temporadas creadas. Crea la primera antes de usar el ranking.
      </p>
    );
  }

  const destino = temporadas.find((t) => t.fechaInicio > seleccionada.fechaInicio) ?? null;

  const [filas, propuestas, historial] = await Promise.all([
    cargarRankingAdmin(categoria, referencia),
    cargarPropuestas(seleccionada.id),
    cargarHistorialRanking(),
  ]);

  const marcas = marcasDe(filas, categoria, seleccionada.plazasAscenso, seleccionada.plazasDescenso);

  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Ranking</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Clasificación por categoría, plazas y propuestas de ascenso y descenso.
        </p>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Temporada</span>
          <select
            name="temporada"
            defaultValue={String(seleccionada.id)}
            className="rounded-md border border-[var(--color-border)] px-2 py-1.5"
          >
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.anio}
                {t.activa ? " (activa)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Categoría</span>
          <select
            name="categoria"
            defaultValue={categoria}
            className="rounded-md border border-[var(--color-border)] px-2 py-1.5"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ETIQUETAS_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Fecha de corte</span>
          <input
            type="date"
            name="referencia"
            defaultValue={referencia}
            className="rounded-md border border-[var(--color-border)] px-2 py-1.5"
          />
        </label>

        <Boton variante="secundario" tamano="md"
          type="submit"
          className=""
        >
          Ver
        </Boton>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Plazas de la temporada {seleccionada.anio}</h2>
        <FormPlazas
          temporadaId={seleccionada.id}
          plazasAscenso={seleccionada.plazasAscenso}
          plazasDescenso={seleccionada.plazasDescenso}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">
          {ETIQUETAS_CATEGORIA[categoria]} · corte {fechaCorta(referencia)}
        </h2>
        <TablaRankingAdmin filas={filas} marcas={marcas} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Propuestas de ascenso y descenso</h2>
        <PanelPropuestas
          temporadaId={seleccionada.id}
          destino={destino ? { id: destino.id, anio: destino.anio } : null}
          referencia={referencia}
          propuestas={propuestas}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Últimos cambios</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Todavía no hay cambios registrados.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-xl bg-white text-sm ring-1 ring-[var(--color-border)]">
            {historial.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span>
                  {ETIQUETA_ACCION[h.accion] ?? h.accion}
                  {h.motivo && <span className="text-[var(--color-muted)]"> · {h.motivo}</span>}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{fechaCorta(h.creadoAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}