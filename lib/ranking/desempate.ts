import { RONDAS, type Ronda } from "@/lib/constantes";

export type EstadisticasPareja = {
    clave: string;
    puntos: number;
    primeros: number;          // campeonatos
    segundos: number;          // subcampeonatos
    terceros: number;          // semifinales perdidas
    mejorRonda: Ronda | null;  // mejor ronda alcanzada en la ventana
    victorias: number;         // partidos ganados en la ventana
};

// Menor índice = mejor ronda. Sin resultados, la peor posición posible.
function indiceRonda(ronda: Ronda | null): number {
    return ronda === null ? RONDAS.length : RONDAS.indexOf(ronda);
}

// Orden de desempate, en el orden acordado:
// 1. Puntos acumulados
// 2. Primeros puestos
// 3. Segundos puestos
// 4. Terceros puestos
// 5. Mejor resultado individual
// 6. Número de victorias
// Si todos los criterios coinciden, la posición se comparte (lo resuelve calcular.ts).
// Devuelve negativo si a va antes que b, positivo si va después, 0 si empatan.
export function compararEstadisticas(
    a: EstadisticasPareja,
    b: EstadisticasPareja
): number {
    return (
        b.puntos - a.puntos ||
        b.primeros - a.primeros ||
        b.segundos - a.segundos ||
        b.terceros - a.terceros ||
        indiceRonda(a.mejorRonda) - indiceRonda(b.mejorRonda) ||
        b.victorias - a.victorias
    );
}

export function sonEmpatadas(a: EstadisticasPareja, b: EstadisticasPareja): boolean {
    return compararEstadisticas(a, b) === 0;
}