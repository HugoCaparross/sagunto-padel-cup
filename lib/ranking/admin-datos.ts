import type { Categoria } from "@/lib/constantes";
import { calcularRanking, type FilaRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type TemporadaAdmin = {
    id: number;
    anio: string;
    activa: boolean;
    fechaInicio: string;
    fechaFin: string;
    plazasAscenso: number;
    plazasDescenso: number;
};

export type FilaRankingAdmin = FilaRanking & { nombre: string };

export type PropuestaAdmin = {
    id: string;
    jugadorId: string;
    nombre: string;
    tipo: "ascenso" | "descenso";
    categoriaOrigen: Categoria;
    categoriaPropuesta: Categoria;
    posicion: number;
    empate: boolean;
    estado: "pendiente" | "confirmada" | "modificada";
    categoriaFinal: Categoria | null;
    motivo: string | null;
};

export type EntradaHistorial = {
    id: number;
    accion: string;
    motivo: string | null;
    creadoAt: string;
};

type TemporadaFila = {
    id: number;
    anio: string;
    activa: boolean;
    fecha_inicio: string;
    fecha_fin: string;
    plazas_ascenso: number;
    plazas_descenso: number;
};

type PropuestaFila = {
    id: string;
    jugador_id: string;
    tipo: "ascenso" | "descenso";
    categoria_origen: Categoria;
    categoria_propuesta: Categoria;
    posicion: number;
    empate_en_frontera: boolean;
    estado: "pendiente" | "confirmada" | "modificada";
    categoria_final: Categoria | null;
    motivo: string | null;
};

const ACCIONES_RANKING = [
    "generar_propuestas",
    "confirmar_propuesta",
    "modificar_propuesta",
    "cambiar_plazas_temporada",
];

export async function cargarTemporadas(): Promise<TemporadaAdmin[]> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
        .from("temporadas")
        .select("id, anio, activa, fecha_inicio, fecha_fin, plazas_ascenso, plazas_descenso")
        .order("fecha_inicio", { ascending: true });
    if (error) throw new Error(error.message);

    return ((data ?? []) as TemporadaFila[]).map((t) => ({
        id: t.id,
        anio: t.anio,
        activa: t.activa,
        fechaInicio: t.fecha_inicio,
        fechaFin: t.fecha_fin,
        plazasAscenso: t.plazas_ascenso,
        plazasDescenso: t.plazas_descenso,
    }));
}

// Ranking de una categoría a una fecha de corte. Muestra nombres completos al organizador.
export async function cargarRankingAdmin(
    categoria: Categoria,
    referencia: string
): Promise<FilaRankingAdmin[]> {
    const { puntos, partidos, perfiles } = await cargarDatosRanking();
    const filas = calcularRanking({ categoria, referencia, puntos, partidos });

    return filas.map((f) => ({
        ...f,
        nombre: perfiles.get(f.clave)?.nombre || "Jugador",
    }));
}

export async function cargarPropuestas(temporadaId: number): Promise<PropuestaAdmin[]> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
        .from("propuestas_categoria")
        .select(
            "id, jugador_id, tipo, categoria_origen, categoria_propuesta, posicion, empate_en_frontera, estado, categoria_final, motivo"
        )
        .eq("temporada_id", temporadaId)
        .order("posicion", { ascending: true });
    if (error) throw new Error(error.message);

    const filas = (data ?? []) as PropuestaFila[];

    const ids = [...new Set(filas.map((f) => f.jugador_id))];
    const nombres = new Map<string, string>();
    if (ids.length > 0) {
        const { data: perfiles, error: errorPerfiles } = await admin
            .from("perfiles")
            .select("id, nombre")
            .in("id", ids);
        if (errorPerfiles) throw new Error(errorPerfiles.message);
        for (const p of (perfiles ?? []) as { id: string; nombre: string }[]) {
            nombres.set(p.id, p.nombre || "Jugador");
        }
    }

    return filas.map((f) => ({
        id: f.id,
        jugadorId: f.jugador_id,
        nombre: nombres.get(f.jugador_id) ?? "Jugador",
        tipo: f.tipo,
        categoriaOrigen: f.categoria_origen,
        categoriaPropuesta: f.categoria_propuesta,
        posicion: f.posicion,
        empate: f.empate_en_frontera,
        estado: f.estado,
        categoriaFinal: f.categoria_final,
        motivo: f.motivo,
    }));
}

export async function cargarHistorialRanking(): Promise<EntradaHistorial[]> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
        .from("auditoria")
        .select("id, accion, motivo, created_at")
        .in("accion", ACCIONES_RANKING)
        .order("created_at", { ascending: false })
        .limit(20);
    if (error) throw new Error(error.message);

    return (
        (data ?? []) as { id: number; accion: string; motivo: string | null; created_at: string }[]
    ).map((a) => ({
        id: a.id,
        accion: a.accion,
        motivo: a.motivo,
        creadoAt: a.created_at,
    }));
}