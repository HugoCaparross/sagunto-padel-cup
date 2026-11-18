import {
    CATEGORIAS,
    CUADROS,
    RONDAS,
    type Categoria,
    type Cuadro,
    type Ronda,
} from "@/lib/constantes";

// Espejo de la tabla public.points_scale.
// Si cambian los puntos en la base de datos, cámbialos aquí también.
// Estructura: ESCALA[ronda][categoria][cuadro] = puntos.
// Tipada con Record: si falta una combinación, TypeScript da error.

type PuntosPorCuadro = Record<Cuadro, number>;
type PuntosPorCategoria = Record<Categoria, PuntosPorCuadro>;

export const ESCALA: Record<Ronda, PuntosPorCategoria> = {
    campeon: {
        primera: { oro: 150, plata: 113, bronce: 90 },
        segunda: { oro: 125, plata: 94, bronce: 75 },
        tercera: { oro: 100, plata: 75, bronce: 60 },
        cuarta: { oro: 80, plata: 60, bronce: 48 },
    },
    subcampeon: {
        primera: { oro: 130, plata: 98, bronce: 78 },
        segunda: { oro: 108, plata: 81, bronce: 65 },
        tercera: { oro: 85, plata: 64, bronce: 51 },
        cuarta: { oro: 68, plata: 51, bronce: 41 },
    },
    semifinalista: {
        primera: { oro: 115, plata: 86, bronce: 69 },
        segunda: { oro: 95, plata: 71, bronce: 57 },
        tercera: { oro: 75, plata: 56, bronce: 45 },
        cuarta: { oro: 60, plata: 45, bronce: 36 },
    },
    cuartos: {
        primera: { oro: 100, plata: 75, bronce: 60 },
        segunda: { oro: 85, plata: 64, bronce: 51 },
        tercera: { oro: 65, plata: 49, bronce: 39 },
        cuarta: { oro: 50, plata: 38, bronce: 30 },
    },
    octavos: {
        primera: { oro: 85, plata: 64, bronce: 51 },
        segunda: { oro: 70, plata: 53, bronce: 42 },
        tercera: { oro: 55, plata: 41, bronce: 33 },
        cuarta: { oro: 40, plata: 30, bronce: 24 },
    },
    dieciseisavos: {
        primera: { oro: 70, plata: 53, bronce: 42 },
        segunda: { oro: 55, plata: 41, bronce: 33 },
        tercera: { oro: 40, plata: 30, bronce: 24 },
        cuarta: { oro: 30, plata: 23, bronce: 18 },
    },
    participacion: {
        primera: { oro: 20, plata: 15, bronce: 12 },
        segunda: { oro: 18, plata: 14, bronce: 11 },
        tercera: { oro: 15, plata: 11, bronce: 9 },
        cuarta: { oro: 12, plata: 9, bronce: 7 },
    },
};

// Puntos que suma una pareja según categoría, cuadro y ronda alcanzada.
export function puntosPara(
    categoria: Categoria,
    cuadro: Cuadro,
    ronda: Ronda
): number {
    return ESCALA[ronda][categoria][cuadro];
}

// Filas planas de la escala, útiles para tablas (página /puntos) y para el seed.
export type FilaEscala = {
    ronda: Ronda;
    categoria: Categoria;
    cuadro: Cuadro;
    puntos: number;
};

export function filasEscala(): FilaEscala[] {
    const filas: FilaEscala[] = [];
    for (const ronda of RONDAS) {
        for (const categoria of CATEGORIAS) {
            for (const cuadro of CUADROS) {
                filas.push({
                    ronda,
                    categoria,
                    cuadro,
                    puntos: ESCALA[ronda][categoria][cuadro],
                });
            }
        }
    }
    return filas;
}