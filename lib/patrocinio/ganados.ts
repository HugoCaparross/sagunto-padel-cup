import type { Categoria, Cuadro } from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type PremioGanado = {
    prueba: string;
    fecha: string;
    categoria: Categoria;
    cuadro: Cuadro;
    revelado: boolean;
    descripcion: string | null; // null mientras el premio está bloqueado
    revelaEl: string | null;
};

type CampeonFila = {
    prueba_id: string;
    categoria: Categoria;
    cuadro: Cuadro;
    fecha: string;
    prueba: { nombre: string } | null;
};

type PremioFila = {
    prueba_id: string;
    categoria: Categoria;
    cuadro: Cuadro;
    descripcion: string;
    revelar_at: string | null;
};

// Premios de los cuadros que el jugador ha ganado como campeón.
export async function premiosGanadosDeJugador(jugadorId: string): Promise<PremioGanado[]> {
    const admin = crearClienteAdmin();

    const { data: campeones, error: errorCampeones } = await admin
        .from("puntos_prueba")
        .select("prueba_id, categoria, cuadro, fecha, prueba:pruebas(nombre)")
        .eq("jugador_id", jugadorId)
        .eq("ronda", "campeon");
    if (errorCampeones) throw new Error(errorCampeones.message);

    const filas = (campeones ?? []) as unknown as CampeonFila[];
    if (filas.length === 0) return [];

    const pruebaIds = [...new Set(filas.map((f) => f.prueba_id))];
    const { data: premios, error: errorPremios } = await admin
        .from("premios")
        .select("prueba_id, categoria, cuadro, descripcion, revelar_at")
        .in("prueba_id", pruebaIds);
    if (errorPremios) throw new Error(errorPremios.message);

    const clave = (prueba: string, categoria: string, cuadro: string) =>
        `${prueba}|${categoria}|${cuadro}`;

    const porClave = new Map(
        ((premios ?? []) as PremioFila[]).map((p) => [clave(p.prueba_id, p.categoria, p.cuadro), p])
    );

    const ahora = Date.now();

    return filas
        .flatMap((f): PremioGanado[] => {
            const premio = porClave.get(clave(f.prueba_id, f.categoria, f.cuadro));
            if (!premio) return [];

            const revelado = !premio.revelar_at || Date.parse(premio.revelar_at) <= ahora;
            return [
                {
                    prueba: f.prueba?.nombre ?? "Prueba",
                    fecha: f.fecha,
                    categoria: f.categoria,
                    cuadro: f.cuadro,
                    revelado,
                    descripcion: revelado ? premio.descripcion : null,
                    revelaEl: premio.revelar_at,
                },
            ];
        })
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
}