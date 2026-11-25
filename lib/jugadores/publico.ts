import type { Categoria, Cuadro, Ronda } from "@/lib/constantes";
import { type EstadisticasJugador } from "@/lib/estadisticas/calcular";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { urlFirmadaFoto } from "@/lib/jugadores/fotos";
import { crearClienteAdmin } from "@/lib/supabase/server";
import { progresoDeJugador, type ProgresoNivel } from "@/lib/xp/niveles";
import { estadisticasHistoricas } from "@/lib/xp/cargar";

export type PruebaJugador = {
    prueba: string;
    fecha: string;
    categoria: Categoria;
    cuadro: Cuadro;
    ronda: Ronda;
    puntos: number;
};

export type FichaPublica = {
    id: string;
    nombre: string;
    fotoUrl: string | null;
    visible: boolean;
    esPropio: boolean;
    datosDeportivos: Record<string, unknown> | null;
    nivel: ProgresoNivel;
    estadisticas: EstadisticasJugador & { puntosHistoricos: number };
    pruebas: PruebaJugador[];
    posiciones: { categoria: Categoria; posicion: number; puntos: number }[];
};

type PerfilFila = {
    id: string;
    nombre: string;
    visibilidad_publica: boolean;
    datos_deportivos: Record<string, unknown> | null;
};

// Devuelve null si el perfil no existe o es privado y no es el del propio usuario.
// Así no se confirma que un jugador privado está registrado.
export async function cargarFichaPublica(
    slug: string,
    usuarioActual: string | null
): Promise<FichaPublica | null> {
    const admin = crearClienteAdmin();

    const { data, error } = await admin
        .from("perfiles")
        .select("id, nombre, visibilidad_publica, datos_deportivos")
        .eq("slug", slug)
        .maybeSingle<PerfilFila>();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const esPropio = usuarioActual === data.id;
    if (!data.visibilidad_publica && !esPropio) return null;

    const estadisticas = await estadisticasHistoricas(data.id);

    const { data: puntosData, error: errorPuntos } = await admin
        .from("puntos_prueba")
        .select("categoria, cuadro, ronda, puntos, fecha, prueba:pruebas(nombre)")
        .eq("jugador_id", data.id)
        .order("fecha", { ascending: false });
    if (errorPuntos) throw new Error(errorPuntos.message);

    const pruebas: PruebaJugador[] = (
        (puntosData ?? []) as unknown as {
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

    // Posición del jugador en cada categoría donde tiene ranking
    const datos = await cargarDatosRanking();
    const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
    const { calcularRanking } = await import("@/lib/ranking/calcular");
    const categorias: Categoria[] = ["primera", "segunda", "tercera", "cuarta"];

    const posiciones = categorias.flatMap((categoria) => {
        const fila = calcularRanking({
            categoria,
            referencia: hoy,
            puntos: datos.puntos,
            partidos: datos.partidos,
        }).find((f) => f.clave === data.id);
        return fila ? [{ categoria, posicion: fila.posicion, puntos: fila.puntos }] : [];
    });
    const fotoPath = data.visibilidad_publica ? datos.perfiles.get(data.id)?.fotoPath ?? null : null;
    const fotoUrl = await urlFirmadaFoto(fotoPath);

    return {
        id: data.id,
        nombre: data.nombre || "Jugador",
        fotoUrl,
        visible: data.visibilidad_publica,
        esPropio,
        datosDeportivos: data.visibilidad_publica ? (data.datos_deportivos ?? null) : null,
        nivel: progresoDeJugador({
            puntosHistoricos: estadisticas.puntosHistoricos,
            pruebasJugadas: estadisticas.pruebasJugadas,
            partidos: estadisticas.partidos,
            porcentajeVictorias: estadisticas.porcentajeVictorias,
        }),
        estadisticas,
        pruebas,
        posiciones,
    };
}

// Jugadores con perfil público, para el selector de enfrentamientos.
export async function listarJugadoresPublicos(): Promise<{ id: string; nombre: string }[]> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
        .from("perfiles")
        .select("id, nombre")
        .eq("visibilidad_publica", true)
        .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as { id: string; nombre: string }[]).map((p) => ({
        id: p.id,
        nombre: p.nombre || "Jugador",
    }));
}
