import type { Categoria } from "@/lib/constantes";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { crearSlugJugador } from "@/lib/jugadores/slug";
import { urlsFirmadasFotos } from "@/lib/jugadores/fotos";
import { progresoDeJugador } from "@/lib/xp/niveles";

export type JugadorListado = {
    id: string;
    slug: string;
    nombre: string;
    categoria: Categoria | null;
    puntos: number;
    pruebas: number;
    partidos: number;
    porcentajeVictorias: number;
    nivel: number;
    tier: string;
    progreso: number;
    fotoUrl: string | null;
};

type Acumulado = {
    puntos: number;
    pruebas: Set<string>;
    partidos: number;
    victorias: number;
    ultimaFecha: string;
    ultimaCategoria: Categoria | null;
};

function vacio(): Acumulado {
    return {
        puntos: 0,
        pruebas: new Set<string>(),
        partidos: 0,
        victorias: 0,
        ultimaFecha: "",
        ultimaCategoria: null,
    };
}

// Solo jugadores con perfil público. Incluye el Máster: el historial personal lo cuenta.
export async function listarJugadoresListado(): Promise<JugadorListado[]> {
    const datos = await cargarDatosRanking({ incluirMaster: true });

    const acum = new Map<string, Acumulado>();
    const obtener = (clave: string): Acumulado => {
        let a = acum.get(clave);
        if (!a) {
            a = vacio();
            acum.set(clave, a);
        }
        return a;
    };

    for (const p of datos.puntos) {
        const a = obtener(p.clave);
        a.puntos += p.puntos;
        a.pruebas.add(p.pruebaId);
        if (p.fecha > a.ultimaFecha) {
            a.ultimaFecha = p.fecha;
            a.ultimaCategoria = p.categoria;
        }
    }

    for (const p of datos.partidos) {
        const a = obtener(p.clave);
        a.partidos++;
        if (p.ganado) a.victorias++;
    }

    const salida: JugadorListado[] = [];

    for (const [id, perfil] of datos.perfiles) {
        if (!perfil.visible) continue;

        const a = acum.get(id) ?? vacio();
        const porcentajeVictorias =
            a.partidos > 0 ? Math.round((a.victorias / a.partidos) * 1000) / 10 : 0;

        const nivel = progresoDeJugador({
            puntosHistoricos: a.puntos,
            pruebasJugadas: a.pruebas.size,
            partidos: a.partidos,
            porcentajeVictorias,
        });

        salida.push({
            id,
            slug: perfil.slug ?? crearSlugJugador(perfil.nombre, id),
            nombre: perfil.nombre || "Jugador",
            fotoUrl: null,
            categoria: a.ultimaCategoria,
            puntos: a.puntos,
            pruebas: a.pruebas.size,
            partidos: a.partidos,
            porcentajeVictorias,
            nivel: nivel.nivel,
            tier: nivel.tier,
            progreso: nivel.progreso,
        });
    }

    const ordenada = salida.sort(
        (x, y) =>
            y.nivel - x.nivel || y.puntos - x.puntos || x.nombre.localeCompare(y.nombre, "es")
    );
    const rutas = ordenada.flatMap((jugador) => {
        const path = datos.perfiles.get(jugador.id)?.fotoPath;
        return path ? [path] : [];
    });
    const urls = await urlsFirmadasFotos(rutas);

    return ordenada.map((jugador) => {
        const path = datos.perfiles.get(jugador.id)?.fotoPath;
        return { ...jugador, fotoUrl: path ? urls.get(path) ?? null : null };
    });
}
