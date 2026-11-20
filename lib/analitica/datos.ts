import { ESTADOS_QUE_OCUPAN_PLAZA, type Categoria } from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type PuntoSemanal = { semana: string; inscripciones: number };
export type PuntoParticipacion = { prueba: string; parejas: number; jugadores: number };
export type PuntoRetencion = {
    de: string;
    a: string;
    porcentaje: number;
    comunes: number;
    base: number;
};
export type PuntoCategoria = { categoria: string; valor: number };

export type DatosAnalitica = {
    kpis: {
        jugadoresRegistrados: number;
        jugadoresActivos: number;
        inscripcionesActivas: number;
        retencionMedia: number | null;
    };
    semanal: PuntoSemanal[];
    participacion: PuntoParticipacion[];
    retencion: PuntoRetencion[];
    categorias: PuntoCategoria[];
};

const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
    primera: "1.ª",
    segunda: "2.ª",
    tercera: "3.ª",
    cuarta: "4.ª",
};

const DIA_MS = 86_400_000;

// Lunes de la semana de una fecha, en horario de Madrid. Formato yyyy-mm-dd.
function inicioSemana(iso: string): string {
    const fecha = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
    const [y, m, d] = fecha.split("-").map(Number);
    const base = Date.UTC(y, m - 1, d);
    const dia = new Date(base).getUTCDay();
    const delta = (dia + 6) % 7;
    return new Date(base - delta * DIA_MS).toISOString().slice(0, 10);
}

type InscripcionFila = {
    id: string;
    prueba_id: string;
    categoria: Categoria;
    estado: string;
    created_at: string;
    jugador_1: string;
    jugador_2: string | null;
};

type PruebaFila = { id: string; nombre: string; fecha_inicio: string; es_master: boolean };

export async function cargarAnalitica(): Promise<DatosAnalitica> {
    const admin = crearClienteAdmin();

    const [pruebasRes, inscRes, perfilesRes] = await Promise.all([
        admin
            .from("pruebas")
            .select("id, nombre, fecha_inicio, es_master")
            .order("fecha_inicio", { ascending: true }),
        admin
            .from("inscripciones")
            .select("id, prueba_id, categoria, estado, created_at, jugador_1, jugador_2"),
        admin.from("perfiles").select("id", { count: "exact", head: true }),
    ]);

    if (pruebasRes.error) throw new Error(pruebasRes.error.message);
    if (inscRes.error) throw new Error(inscRes.error.message);
    if (perfilesRes.error) throw new Error(perfilesRes.error.message);

    const pruebas = (pruebasRes.data ?? []) as PruebaFila[];
    const todas = (inscRes.data ?? []) as InscripcionFila[];
    const validas = todas.filter((i) => i.estado !== "retirada");
    const activas = validas.filter((i) => (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(i.estado));

    // Jugadores con inscripción activa
    const jugadoresActivos = new Set<string>();
    for (const i of activas) {
        jugadoresActivos.add(i.jugador_1);
        if (i.jugador_2) jugadoresActivos.add(i.jugador_2);
    }

    // Semanal: últimas 12 semanas, incluida la actual
    const hoyIso = new Date().toISOString();
    const semanaActual = inicioSemana(hoyIso);
    const claves: string[] = [];
    for (let s = 11; s >= 0; s--) {
        claves.push(new Date(Date.parse(`${semanaActual}T00:00:00Z`) - s * 7 * DIA_MS).toISOString().slice(0, 10));
    }
    const conteoSemanal = new Map(claves.map((c) => [c, 0]));
    for (const i of validas) {
        const clave = inicioSemana(i.created_at);
        if (conteoSemanal.has(clave)) conteoSemanal.set(clave, (conteoSemanal.get(clave) ?? 0) + 1);
    }
    const semanal: PuntoSemanal[] = claves.map((c) => ({
        semana: c.slice(5),
        inscripciones: conteoSemanal.get(c) ?? 0,
    }));

    // Jugadores por prueba (solo inscripciones válidas)
    const jugadoresPorPrueba = new Map<string, Set<string>>();
    for (const i of validas) {
        const conjunto = jugadoresPorPrueba.get(i.prueba_id) ?? new Set<string>();
        conjunto.add(i.jugador_1);
        if (i.jugador_2) conjunto.add(i.jugador_2);
        jugadoresPorPrueba.set(i.prueba_id, conjunto);
    }

    // Parejas activas por prueba
    const parejasPorPrueba = new Map<string, number>();
    for (const i of activas) {
        parejasPorPrueba.set(i.prueba_id, (parejasPorPrueba.get(i.prueba_id) ?? 0) + 1);
    }

    const participacion: PuntoParticipacion[] = pruebas.map((p) => ({
        prueba: p.nombre,
        parejas: parejasPorPrueba.get(p.id) ?? 0,
        jugadores: jugadoresPorPrueba.get(p.id)?.size ?? 0,
    }));

    // Retención: de cada prueba (sin Máster) a la siguiente
    const circuito = pruebas.filter((p) => !p.es_master);
    const retencion: PuntoRetencion[] = [];
    for (let i = 0; i < circuito.length - 1; i++) {
        const a = circuito[i];
        const b = circuito[i + 1];
        const jugadoresA = jugadoresPorPrueba.get(a.id);
        const jugadoresB = jugadoresPorPrueba.get(b.id) ?? new Set<string>();
        if (!jugadoresA || jugadoresA.size === 0) continue;

        let comunes = 0;
        for (const j of jugadoresA) if (jugadoresB.has(j)) comunes++;

        retencion.push({
            de: a.nombre,
            a: b.nombre,
            porcentaje: Math.round((comunes / jugadoresA.size) * 1000) / 10,
            comunes,
            base: jugadoresA.size,
        });
    }

    // Reparto por categoría (inscripciones activas)
    const porCategoria = new Map<string, number>();
    for (const i of activas) {
        porCategoria.set(i.categoria, (porCategoria.get(i.categoria) ?? 0) + 1);
    }
    const categorias: PuntoCategoria[] = (["primera", "segunda", "tercera", "cuarta"] as Categoria[])
        .filter((c) => (porCategoria.get(c) ?? 0) > 0)
        .map((c) => ({ categoria: ETIQUETA_CATEGORIA[c], valor: porCategoria.get(c) ?? 0 }));

    const retencionMedia =
        retencion.length > 0
            ? Math.round((retencion.reduce((s, r) => s + r.porcentaje, 0) / retencion.length) * 10) / 10
            : null;

    return {
        kpis: {
            jugadoresRegistrados: perfilesRes.count ?? 0,
            jugadoresActivos: jugadoresActivos.size,
            inscripcionesActivas: activas.length,
            retencionMedia,
        },
        semanal,
        participacion,
        retencion,
        categorias,
    };
}