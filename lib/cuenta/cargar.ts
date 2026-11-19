import type {
    Categoria,
    Cuadro,
    EstadoInscripcion,
    EstadoPrueba,
    Ronda,
} from "@/lib/constantes";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type PruebaResumen = {
    id: string;
    slug: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    sede: string;
    estado: EstadoPrueba;
};

export type InscripcionJugador = {
    id: string;
    categoria: Categoria;
    estado: EstadoInscripcion;
    checkinAt: string | null;
    texto: string;
    prueba: PruebaResumen;
    activa: boolean;
    puedeRetirarse: boolean;
};

export type PuntoJugador = {
    prueba: string;
    fecha: string;
    categoria: Categoria;
    cuadro: Cuadro;
    ronda: Ronda;
    puntos: number;
};

type PruebaFila = {
    id: string;
    slug: string;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    sede: string;
    estado: EstadoPrueba;
};

type InscripcionFila = {
    id: string;
    categoria: Categoria;
    estado: EstadoInscripcion;
    checkin_at: string | null;
    jugador_1: string;
    jugador_2: string | null;
    prueba: PruebaFila | null;
};

const ESTADOS_ACTIVOS: readonly EstadoInscripcion[] = [
    "pendiente",
    "confirmada",
    "pagada_en_prueba",
    "lista_espera",
];

const ESTADOS_PRUEBA_BLOQUEADOS: readonly EstadoPrueba[] = ["en_curso", "finalizada"];

function aResumen(p: PruebaFila): PruebaResumen {
    return {
        id: p.id,
        slug: p.slug,
        nombre: p.nombre,
        fechaInicio: p.fecha_inicio,
        fechaFin: p.fecha_fin,
        sede: p.sede,
        estado: p.estado,
    };
}

// Nombres de jugadores. Solo se llama con ids de inscripciones del propio usuario.
async function nombresDe(ids: string[]): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    if (ids.length === 0) return mapa;

    const admin = crearClienteAdmin();
    const { data, error } = await admin.from("perfiles").select("id, nombre").in("id", ids);
    if (error) throw new Error(error.message);

    for (const p of (data ?? []) as { id: string; nombre: string }[]) {
        mapa.set(p.id, p.nombre || "Jugador");
    }
    return mapa;
}

// Inscripciones en las que participa el usuario, con su estado y la prueba.
export async function cargarInscripcionesJugador(
    userId: string
): Promise<InscripcionJugador[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from("inscripciones")
        .select(
            "id, categoria, estado, checkin_at, jugador_1, jugador_2, prueba:pruebas(id, slug, nombre, fecha_inicio, fecha_fin, sede, estado)"
        )
        .or(`jugador_1.eq.${userId},jugador_2.eq.${userId}`)
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const filas = ((data ?? []) as unknown as InscripcionFila[]).filter((f) => f.prueba);

    const ids = [
        ...new Set(
            filas.flatMap((f) => [f.jugador_1, f.jugador_2].filter((x): x is string => Boolean(x)))
        ),
    ];
    const nombres = await nombresDe(ids);

    return filas.map((f) => {
        const prueba = aResumen(f.prueba as PruebaFila);
        const compañero = f.jugador_1 === userId ? f.jugador_2 : f.jugador_1;
        const texto = compañero
            ? `Tú / ${nombres.get(compañero) ?? "Jugador"}`
            : "Tú (sin pareja)";

        return {
            id: f.id,
            categoria: f.categoria,
            estado: f.estado,
            checkinAt: f.checkin_at,
            texto,
            prueba,
            activa: ESTADOS_ACTIVOS.includes(f.estado),
            puedeRetirarse:
                f.estado !== "retirada" && !ESTADOS_PRUEBA_BLOQUEADOS.includes(prueba.estado),
        };
    });
}

// Primera prueba que aún no ha terminado.
export async function cargarProximaPrueba(): Promise<PruebaResumen | null> {
    const supabase = await crearClienteServidor();
    const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

    const { data, error } = await supabase
        .from("pruebas")
        .select("id, slug, nombre, fecha_inicio, fecha_fin, sede, estado")
        .in("estado", ["proxima", "abierta", "cerrada", "en_curso"])
        .gte("fecha_fin", hoy)
        .order("fecha_inicio", { ascending: true })
        .limit(1)
        .maybeSingle<PruebaFila>();
    if (error) throw new Error(error.message);

    return data ? aResumen(data) : null;
}

// Puntos obtenidos por el jugador en cada prueba, del más reciente al más antiguo.
export async function cargarPuntosJugador(userId: string): Promise<PuntoJugador[]> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
        .from("puntos_prueba")
        .select("categoria, cuadro, ronda, puntos, fecha, prueba:pruebas(nombre)")
        .eq("jugador_id", userId)
        .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);

    return (
        (data ?? []) as unknown as {
            categoria: Categoria;
            cuadro: Cuadro;
            ronda: Ronda;
            puntos: number;
            fecha: string;
            prueba: { nombre: string } | null;
        }[]
    ).map((p) => ({
        prueba: p.prueba?.nombre ?? "Prueba",
        fecha: p.fecha,
        categoria: p.categoria,
        cuadro: p.cuadro,
        ronda: p.ronda,
        puntos: p.puntos,
    }));
}