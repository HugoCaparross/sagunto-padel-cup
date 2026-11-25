import type { Categoria } from "@/lib/constantes";
import { calcularRanking, type FilaRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { crearSlugJugador } from "@/lib/jugadores/slug";

export type FilaRankingPublica = FilaRanking & {
    nombre: string;
    // El perfil solo tiene enlace si el jugador lo ha hecho público
    enlace: string | null;
};

// Ranking de una categoría a una fecha de corte, con la privacidad aplicada.
// Nunca devuelve el nombre de un jugador que no tenga visibilidad pública.
export async function obtenerRankingPublico(
    categoria: Categoria,
    referencia: string
): Promise<FilaRankingPublica[]> {
    const datos = await cargarDatosRanking();

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
            enlace: visible && perfil ? `/jugadores/${crearSlugJugador(perfil.nombre, f.clave)}` : null,
        };
    });
}
