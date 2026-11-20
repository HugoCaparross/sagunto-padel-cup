import type { Metadata } from "next";
import PanelInscripciones, { type FilaPanel } from "@/components/inscripciones/PanelInscripciones";
import {
  CATEGORIAS,
  ESTADOS_INSCRIPCION,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_INSCRIPCION,
  type Categoria,
  type EstadoInscripcion,
} from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscripciones · Admin" };

type Props = {
  searchParams: Promise<{ prueba?: string; categoria?: string; estado?: string }>;
};

type InscripcionRow = {
  id: string;
  categoria: Categoria;
  estado: EstadoInscripcion;
  checkin_at: string | null;
  created_at: string;
  jugador_1: string;
  jugador_2: string | null;
};

export default async function PaginaInscripcionesAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const admin = crearClienteAdmin();

  const { data: pruebasData } = await admin
    .from("pruebas")
    .select("id, nombre, slug")
    .order("fecha_inicio", { ascending: true });
  const pruebas = (pruebasData ?? []) as { id: string; nombre: string; slug: string }[];

  if (pruebas.length === 0) {
    return <p className="text-sm text-muted">Crea una prueba antes de gestionar inscripciones.</p>;
  }

  const pruebaId = pruebas.find((p) => p.id === sp.prueba)?.id ?? pruebas[0].id;
  const categoria = (CATEGORIAS as readonly string[]).includes(sp.categoria ?? "")
    ? (sp.categoria as Categoria)
    : "";
  const estado = (ESTADOS_INSCRIPCION as readonly string[]).includes(sp.estado ?? "")
    ? (sp.estado as EstadoInscripcion)
    : "";

  let consulta = admin
    .from("inscripciones")
    .select("id, categoria, estado, checkin_at, created_at, jugador_1, jugador_2")
    .eq("prueba_id", pruebaId)
    .order("created_at", { ascending: true });

  if (categoria) consulta = consulta.eq("categoria", categoria);
  if (estado) consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;
  if (error) return <p className="alerta alerta-error">{error.message}</p>;

  const filasBD = (data ?? []) as InscripcionRow[];

  const ids = [...new Set(filasBD.flatMap((i) => [i.jugador_1, i.jugador_2]).filter((x): x is string => Boolean(x)))];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: perfiles } = await admin.from("perfiles").select("id, nombre").in("id", ids);
    for (const p of (perfiles ?? []) as { id: string; nombre: string }[]) {
      nombres.set(p.id, p.nombre || "Jugador");
    }
  }

  const filas: FilaPanel[] = filasBD.map((i) => {
    const uno = nombres.get(i.jugador_1) ?? "Jugador";
    const texto = i.jugador_2 ? `${uno} / ${nombres.get(i.jugador_2) ?? "Jugador"}` : `${uno} (sin pareja)`;
    return {
      id: i.id,
      categoria: i.categoria,
      estado: i.estado,
      texto,
      llegada: i.checkin_at,
      alta: i.created_at,
    };
  });

  return (
    <main className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Inscripciones</h1>
          <p className="text-sm text-muted">{filas.length} resultados con estos filtros</p>
        </div>

        <form method="get" className="card grid gap-3 p-4 text-sm md:grid-cols-4 md:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-muted">Prueba</span>
            <select name="prueba" defaultValue={pruebaId}>
              {pruebas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Categoría</span>
            <select name="categoria" defaultValue={categoria}>
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{ETIQUETAS_CATEGORIA[c]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Estado</span>
            <select name="estado" defaultValue={estado}>
              <option value="">Todos</option>
              {ESTADOS_INSCRIPCION.map((e) => (
                <option key={e} value={e}>{ETIQUETAS_ESTADO_INSCRIPCION[e]}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primario">Filtrar</button>
        </form>
      </header>

      <PanelInscripciones filas={filas} />
    </main>
  );
}