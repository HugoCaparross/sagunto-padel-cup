import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import { calcularRanking, type FilaRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { crearSlugJugador } from "@/lib/jugadores/slug";
import type { DatosRanking } from "@/lib/ranking/cargar";

export type FilaRankingPublica = FilaRanking & {
    nombre: string;
    // El perfil solo tiene enlace si el jugador lo ha hecho público
    enlace: string | null;
};

// Ranking de una categoría a una fecha de corte, con la privacidad aplicada.
// Nunca devuelve el nombre de un jugador que no tenga visibilidad pública.
function convertirFilasPublicas(datos: DatosRanking, categoria: Categoria, referencia: string): FilaRankingPublica[] {
    const filas = calcularRanking({
        categoria,
        referencia,
        puntos: datos.puntos,
        partidos: datos.partidos,
    });

    return filas.map((f) => {
        const perfil = datos.perfiles.get(f.clave);
        const visible = perfil?.visible ?? false;

        return {
            ...f,
            nombre: visible && perfil ? perfil.nombre || "Jugador" : "Jugador privado",
            enlace: visible && perfil ? `/jugadores/${perfil.slug ?? crearSlugJugador(perfil.nombre, f.clave)}` : null,
        };
    });
}

export async function obtenerRankingPublico(categoria: Categoria, referencia: string): Promise<FilaRankingPublica[]> {
    return convertirFilasPublicas(await cargarDatosRanking(), categoria, referencia);
}

export async function obtenerRankingsPublicos(referencia: string): Promise<Record<Categoria, FilaRankingPublica[]>> {
    const datos = await cargarDatosRanking();
    return Object.fromEntries(CATEGORIAS.map((categoria) => [categoria, convertirFilasPublicas(datos, categoria, referencia)])) as Record<Categoria, FilaRankingPublica[]>;
}
