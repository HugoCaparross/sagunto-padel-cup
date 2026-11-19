import {
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type Cuadro,
    type EstadoInscripcion,
    type Ronda,
} from "@/lib/constantes";
import type { EstadisticasJugador } from "@/lib/estadisticas/calcular";
import { crearClienteAdmin } from "@/lib/supabase/server";
import { estadisticasHistoricas } from "@/lib/xp/cargar";
import { progresoDeJugador, type ProgresoNivel } from "@/lib/xp/niveles";

export type FilaJugador = {
    id: string;
    nombre: string;
    email: string | null;
    rol: string;
    visible: boolean;
    onboardingCompleto: boolean;
    inscripcionesActivas: number;
    pruebasJugadas: number;
    puntos: number;
    ultimaActividad: string | null;
};

export type FilaInscripcionJugador = {
    id: string;
    pruebaId: string;
    prueba: string;
    fecha: string;
    categoria: Categoria;
    estado: EstadoInscripcion;
    checkinAt: string | null;
    companero: string | null;
};

export type FilaPuntoJugador = {
    prueba: string;
    fecha: string;
    categoria: Categoria;
    cuadro: Cuadro;
    ronda: Ronda;
    puntos: number;
};

export type FilaConsentimiento = {
    id: number;
    tipo: string;
    concedido: boolean;
    registradoAt: string;
    version: number | null;
    titulo: string | null;
};

// Estadísticas completas: incluyen sets, juegos y mejor resultado, además de los puntos históricos.
export type EstadisticasFicha = EstadisticasJugador & { puntosHistoricos: number };

export type FichaJugador = {
    perfil: {
        id: string;
        nombre: string;
        email: string | null;
        rol: string;
        visible: boolean;
        talla: string | null;
        consentimientoImagen: boolean;
        onboardingAt: string | null;
        creadoAt: string;
        datosDeportivos: Record<string, unknown> | null;
    };
    nivel: ProgresoNivel;
    estadisticas: EstadisticasFicha;
    inscripciones: FilaInscripcionJugador[];
    puntos: FilaPuntoJugador[];
    consentimientos: FilaConsentimiento[];
};

type PerfilListado = {
    id: string;
    nombre: string;
    rol: string;
    visibilidad_publica: boolean;
    onboarding_completado_at: string | null;
};

type InscripcionListado = {
    id: string;
    jugador_1: string;
    jugador_2: string | null;
    estado: EstadoInscripcion;
    created_at: string;
};

type PuntoListado = { jugador_id: string; prueba_id: string; puntos: number };

// Emails desde Supabase Auth, en páginas de 200 usuarios.
async function cargarEmails(): Promise<Map<string, string>> {
    const admin = crearClienteAdmin();
    const mapa = new Map<string, string>();
    let pagina = 1;

    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
        if (error) throw new Error(error.message);

        for (const u of data.users) {
            if (u.email) mapa.set(u.id, u.email);
        }
        if (data.users.length < 200) break;
        pagina++;
    }

    return mapa;
}

function masReciente(actual: string | null, candidata: string): string {
    return actual === null || candidata > actual ? candidata : actual;
}

export async function cargarListadoJugadores(): Promise<FilaJugador[]> {
    const admin = crearClienteAdmin();

    const { data: perfiles, error: errorPerfiles } = await admin
        .from("perfiles")
        .select("id, nombre, rol, visibilidad_publica, onboarding_completado_at")
        .order("nombre", { ascending: true });
    if (errorPerfiles) throw new Error(errorPerfiles.message);

    const { data: inscripciones, error: errorInsc } = await admin
        .from("inscripciones")
        .select("id, jugador_1, jugador_2, estado, created_at");
    if (errorInsc) throw new Error(errorInsc.message);

    const { data: puntos, error: errorPuntos } = await admin
        .from("puntos_prueba")
        .select("jugador_id, prueba_id, puntos");
    if (errorPuntos) throw new Error(errorPuntos.message);

    const emails = await cargarEmails();

    const activas = new Map<string, number>();
    const ultima = new Map<string, string | null>();
    for (const i of (inscripciones ?? []) as InscripcionListado[]) {
        const ocupa = (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(i.estado);
        for (const jugador of [i.jugador_1, i.jugador_2]) {
            if (!jugador) continue;
            if (ocupa) activas.set(jugador, (activas.get(jugador) ?? 0) + 1);
            ultima.set(jugador, masReciente(ultima.get(jugador) ?? null, i.created_at));
        }
    }

    const totalPuntos = new Map<string, number>();
    const pruebas = new Map<string, Set<string>>();
    for (const p of (puntos ?? []) as PuntoListado[]) {
        totalPuntos.set(p.jugador_id, (totalPuntos.get(p.jugador_id) ?? 0) + p.puntos);
        const conjunto = pruebas.get(p.jugador_id) ?? new Set<string>();
        conjunto.add(p.prueba_id);
        pruebas.set(p.jugador_id, conjunto);
    }

    return ((perfiles ?? []) as PerfilListado[]).map((p) => ({
        id: p.id,
        nombre: p.nombre || "Sin nombre",
        email: emails.get(p.id) ?? null,
        rol: p.rol,
        visible: p.visibilidad_publica,
        onboardingCompleto: p.onboarding_completado_at !== null,
        inscripcionesActivas: activas.get(p.id) ?? 0,
        pruebasJugadas: pruebas.get(p.id)?.size ?? 0,
        puntos: totalPuntos.get(p.id) ?? 0,
        ultimaActividad: ultima.get(p.id) ?? null,
    }));
}

export async function cargarFichaJugador(id: string): Promise<FichaJugador | null> {
    const admin = crearClienteAdmin();

    const { data: perfil, error: errorPerfil } = await admin
        .from("perfiles")
        .select(
            "id, nombre, rol, visibilidad_publica, talla_camiseta, consentimiento_imagen, onboarding_completado_at, created_at, datos_deportivos"
        )
        .eq("id", id)
        .maybeSingle();
    if (errorPerfil) throw new Error(errorPerfil.message);
    if (!perfil) return null;

    const { data: usuario } = await admin.auth.admin.getUserById(id);

    const { data: inscData, error: errorInsc } = await admin
        .from("inscripciones")
        .select(
            "id, categoria, estado, checkin_at, jugador_1, jugador_2, prueba_id, prueba:pruebas(nombre, fecha_inicio)"
        )
        .or(`jugador_1.eq.${id},jugador_2.eq.${id}`)
        .order("created_at", { ascending: false });
    if (errorInsc) throw new Error(errorInsc.message);

    const filasInsc = (inscData ?? []) as unknown as {
        id: string;
        categoria: Categoria;
        estado: EstadoInscripcion;
        checkin_at: string | null;
        jugador_1: string;
        jugador_2: string | null;
        prueba_id: string;
        prueba: { nombre: string; fecha_inicio: string } | null;
    }[];

    const companeros = [
        ...new Set(
            filasInsc
                .map((i) => (i.jugador_1 === id ? i.jugador_2 : i.jugador_1))
                .filter((x): x is string => Boolean(x))
        ),
    ];
    const nombres = new Map<string, string>();
    if (companeros.length > 0) {
        const { data: pf, error: errorPf } = await admin
            .from("perfiles")
            .select("id, nombre")
            .in("id", companeros);
        if (errorPf) throw new Error(errorPf.message);
        for (const p of (pf ?? []) as { id: string; nombre: string }[]) {
            nombres.set(p.id, p.nombre || "Jugador");
        }
    }

    const { data: puntosData, error: errorPuntos } = await admin
        .from("puntos_prueba")
        .select("categoria, cuadro, ronda, puntos, fecha, prueba:pruebas(nombre)")
        .eq("jugador_id", id)
        .order("fecha", { ascending: false });
    if (errorPuntos) throw new Error(errorPuntos.message);

    const { data: consData, error: errorCons } = await admin
        .from("consentimientos")
        .select("id, tipo, concedido, documento_id, registrado_at")
        .eq("perfil_id", id)
        .order("registrado_at", { ascending: false });
    if (errorCons) throw new Error(errorCons.message);

    const { data: docsData, error: errorDocs } = await admin
        .from("documentos_legales")
        .select("id, version, titulo");
    if (errorDocs) throw new Error(errorDocs.message);

    const docs = new Map(
        ((docsData ?? []) as { id: string; version: number; titulo: string }[]).map((d) => [d.id, d])
    );

    const estadisticas = await estadisticasHistoricas(id);

    return {
        perfil: {
            id: perfil.id,
            nombre: perfil.nombre || "Sin nombre",
            email: usuario.user?.email ?? null,
            rol: perfil.rol,
            visible: perfil.visibilidad_publica,
            talla: perfil.talla_camiseta,
            consentimientoImagen: perfil.consentimiento_imagen,
            onboardingAt: perfil.onboarding_completado_at,
            creadoAt: perfil.created_at,
            datosDeportivos: (perfil.datos_deportivos as Record<string, unknown>) ?? null,
        },
        nivel: progresoDeJugador(estadisticas),
        estadisticas,
        inscripciones: filasInsc.map((i) => {
            const otro = i.jugador_1 === id ? i.jugador_2 : i.jugador_1;
            return {
                id: i.id,
                pruebaId: i.prueba_id,
                prueba: i.prueba?.nombre ?? "Prueba",
                fecha: i.prueba?.fecha_inicio ?? "",
                categoria: i.categoria,
                estado: i.estado,
                checkinAt: i.checkin_at,
                companero: otro ? (nombres.get(otro) ?? "Jugador") : null,
            };
        }),
        puntos: ((puntosData ?? []) as unknown as {
            categoria: Categoria;
            cuadro: Cuadro;
            ronda: Ronda;
            puntos: number;
            fecha: string;
            prueba: { nombre: string } | null;
        }[]).map((p) => ({
            prueba: p.prueba?.nombre ?? "Prueba",
            fecha: p.fecha,
            categoria: p.categoria,
            cuadro: p.cuadro,
            ronda: p.ronda,
            puntos: p.puntos,
        })),
        consentimientos: ((consData ?? []) as {
            id: number;
            tipo: string;
            concedido: boolean;
            documento_id: string | null;
            registrado_at: string;
        }[]).map((c) => {
            const doc = c.documento_id ? docs.get(c.documento_id) : undefined;
            return {
                id: c.id,
                tipo: c.tipo,
                concedido: c.concedido,
                registradoAt: c.registrado_at,
                version: doc?.version ?? null,
                titulo: doc?.titulo ?? null,
            };
        }),
    };
}