import {
    CATEGORIAS,
    type Categoria,
    type Cuadro,
    type EstadoPrueba,
} from "@/lib/constantes";
import { desdeInstante, aHora } from "@/lib/horarios/tiempo";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type PruebaPublica = {
    id: string;
    slug: string;
    nombre: string;
    estado: EstadoPrueba;
    fechaInicio: string;
    fechaFin: string;
    inscripcionesAbrenAt: string | null;
    inscripcionesCierranAt: string | null;
    horaInicio: string;
    horaFin: string;
    sede: string;
    sedeUrl: string | null;
    precioCentimos: number;
    esMaster: boolean;
    plazasMaximas: number;
    plazasLibres: number;
    categorias: Categoria[];
};

export type PartidoPublico = {
    id: string;
    categoria: Categoria;
    fase: "grupo" | "eliminatoria";
    cuadro: Cuadro | null;
    grupo: string | null;
    ronda: string | null;
    ladoA: string;
    ladoB: string;
    resultado: string | null;
    sets: [number, number][] | null;
    pista: number | null;
    fecha: string | null;
    hora: string | null;
};

type PruebaRow = {
    id: string;
    slug: string;
    nombre: string;
    estado: EstadoPrueba;
    fecha_inicio: string;
    fecha_fin: string;
    inscripciones_abren_at: string | null;
    inscripciones_cierran_at: string | null;
    hora_inicio: string;
    hora_fin: string;
    sede: string;
    sede_url: string | null;
    precio_pareja_centimos: number;
    es_master: boolean;
    plazas_maximas: number;
};

type PartidoRow = {
    id: string;
    categoria: Categoria;
    fase: "grupo" | "eliminatoria";
    cuadro: Cuadro | null;
    grupo: string | null;
    ronda: string | null;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    origen_a: string | null;
    origen_b: string | null;
    ganador_id: string | null;
    resultado: [number, number][] | null;
    inicio: string | null;
    pista: { numero: number } | null;
};

const POR_DEFINIR = "Por definir";

export async function listarPruebasPublicas(): Promise<PruebaPublica[]> {
    const supabase = await crearClienteServidor();

    const [pruebasRes, catsRes, ocupRes] = await Promise.all([
        supabase
            .from("pruebas")
            .select(
                "id, slug, nombre, estado, fecha_inicio, fecha_fin, inscripciones_abren_at, inscripciones_cierran_at, hora_inicio, hora_fin, sede, sede_url, precio_pareja_centimos, es_master, plazas_maximas"
            )
            .order("fecha_inicio", { ascending: true }),
        supabase.from("prueba_categorias").select("prueba_id, categoria"),
        supabase.from("v_ocupacion").select("prueba_id, ocupadas"),
    ]);

    if (pruebasRes.error) throw new Error(pruebasRes.error.message);
    if (catsRes.error) throw new Error(catsRes.error.message);
    if (ocupRes.error) throw new Error(ocupRes.error.message);

    const categoriasDe = new Map<string, Categoria[]>();
    for (const c of (catsRes.data ?? []) as { prueba_id: string; categoria: Categoria }[]) {
        const lista = categoriasDe.get(c.prueba_id) ?? [];
        lista.push(c.categoria);
        categoriasDe.set(c.prueba_id, lista);
    }

    const ocupadasDe = new Map<string, number>();
    for (const o of (ocupRes.data ?? []) as { prueba_id: string; ocupadas: number }[]) {
        ocupadasDe.set(o.prueba_id, (ocupadasDe.get(o.prueba_id) ?? 0) + o.ocupadas);
    }

    return ((pruebasRes.data ?? []) as PruebaRow[]).map((p) => ({
        id: p.id,
        slug: p.slug,
        nombre: p.nombre,
        estado: p.estado,
        fechaInicio: p.fecha_inicio,
        fechaFin: p.fecha_fin,
        inscripcionesAbrenAt: p.inscripciones_abren_at,
        inscripcionesCierranAt: p.inscripciones_cierran_at,
        horaInicio: p.hora_inicio.slice(0, 5),
        horaFin: p.hora_fin.slice(0, 5),
        sede: p.sede,
        sedeUrl: p.sede_url,
        precioCentimos: p.precio_pareja_centimos,
        esMaster: p.es_master,
        plazasMaximas: p.plazas_maximas,
        plazasLibres: Math.max(0, p.plazas_maximas - (ocupadasDe.get(p.id) ?? 0)),
        categorias: CATEGORIAS.filter((c) => (categoriasDe.get(p.id) ?? []).includes(c)),
    }));
}

// Texto de cada pareja de una inscripción, con la privacidad aplicada.
async function textosDeParejas(ids: string[]): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    if (ids.length === 0) return mapa;

    const admin = crearClienteAdmin();

    const { data: insc, error: errorInsc } = await admin
        .from("inscripciones")
        .select("id, jugador_1, jugador_2")
        .in("id", ids);
    if (errorInsc) throw new Error(errorInsc.message);

    const filas = (insc ?? []) as { id: string; jugador_1: string; jugador_2: string | null }[];
    const jugadores = [
        ...new Set(
            filas.flatMap((i) => [i.jugador_1, i.jugador_2].filter((x): x is string => Boolean(x)))
        ),
    ];

    const nombres = new Map<string, string>();
    if (jugadores.length > 0) {
        const { data: perfiles, error: errorPerfiles } = await admin
            .from("perfiles")
            .select("id, nombre, visibilidad_publica")
            .in("id", jugadores);
        if (errorPerfiles) throw new Error(errorPerfiles.message);

        for (const p of (perfiles ?? []) as {
            id: string;
            nombre: string;
            visibilidad_publica: boolean;
        }[]) {
            nombres.set(p.id, p.visibilidad_publica ? p.nombre || "Jugador" : "Jugador privado");
        }
    }

    for (const i of filas) {
        const texto = [i.jugador_1, i.jugador_2]
            .filter((x): x is string => Boolean(x))
            .map((id) => nombres.get(id) ?? "Jugador")
            .join(" / ");
        mapa.set(i.id, texto);
    }
    return mapa;
}

function formatearResultado(sets: [number, number][] | null): string | null {
    if (!sets || sets.length === 0) return null;
    return sets.map(([a, b]) => `${a}-${b}`).join(" × ");
}

export async function cargarPartidosPublicos(pruebaId: string): Promise<PartidoPublico[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from("partidos")
        .select(
            "id, categoria, fase, cuadro, grupo, ronda, inscripcion_a, inscripcion_b, origen_a, origen_b, ganador_id, resultado, inicio, pista:pistas(numero)"
        )
        .eq("prueba_id", pruebaId)
        .order("orden", { ascending: true });
    if (error) throw new Error(error.message);

    const filas = ((data ?? []) as unknown as PartidoRow[]).filter(
        (f) => f.ronda !== "automatico"
    );

    const idsInscripcion = [
        ...new Set(
            filas.flatMap((f) => [f.inscripcion_a, f.inscripcion_b]).filter((x): x is string => Boolean(x))
        ),
    ];
    const textos = await textosDeParejas(idsInscripcion);

    const ladoDe = (inscripcion: string | null, origen: string | null): string => {
        if (inscripcion) return textos.get(inscripcion) ?? POR_DEFINIR;
        return origen ? POR_DEFINIR : POR_DEFINIR;
    };

    return filas.map((f) => {
        const cita = f.inicio ? desdeInstante(f.inicio) : null;
        return {
            id: f.id,
            categoria: f.categoria,
            fase: f.fase,
            cuadro: f.cuadro,
            grupo: f.grupo,
            ronda: f.ronda,
            ladoA: ladoDe(f.inscripcion_a, f.origen_a),
            ladoB: ladoDe(f.inscripcion_b, f.origen_b),
            resultado: f.ganador_id ? formatearResultado(f.resultado) : null,
            sets: f.ganador_id ? f.resultado : null,
            pista: f.pista?.numero ?? null,
            fecha: cita?.fecha ?? null,
            hora: cita ? aHora(cita.minutos) : null,
        };
    });
}
