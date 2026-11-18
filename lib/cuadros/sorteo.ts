import type { Origen } from "@/lib/cuadros/formatos";

export type ParejaSorteo = { id: string; puntos: number };

export type ParticipanteLlave = {
    id: string;
    grupo: string;     // "A", "B"… (cadena vacía si no viene de un grupo)
    posicion: number;  // posición en su grupo
    puntos: number;    // suma de puntos de sus dos jugadores
};

function mezclar<T>(lista: readonly T[]): T[] {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// ---------------------------------------------------------
// 1. Reparto en grupos
// Las dos mejores parejas por puntos van a grupos distintos.
// El resto se reparte al azar respetando los tamaños.
// Devuelve, por grupo, los ids de las parejas.
// ---------------------------------------------------------
export function sortearGrupos(
    parejas: ParejaSorteo[],
    tamanos: number[]
): string[][] {
    const total = tamanos.reduce((a, b) => a + b, 0);
    if (parejas.length !== total) {
        throw new Error(
            `Hay ${parejas.length} parejas para grupos con ${total} plazas`
        );
    }

    const ordenadas = [...parejas].sort((a, b) => b.puntos - a.puntos);
    const grupos: string[][] = tamanos.map(() => []);

    const cabezas = Math.min(2, tamanos.length);
    for (let g = 0; g < cabezas; g++) {
        grupos[g].push(ordenadas[g].id);
    }

    const huecos: number[] = [];
    tamanos.forEach((tamano, g) => {
        for (let i = grupos[g].length; i < tamano; i++) huecos.push(g);
    });

    const resto = mezclar(ordenadas.slice(cabezas));
    const huecosMezclados = mezclar(huecos);
    resto.forEach((pareja, i) => {
        grupos[huecosMezclados[i]].push(pareja.id);
    });

    return grupos;
}

// ---------------------------------------------------------
// 2. Cruces de una llave (2, 4 u 8 parejas)
// R1. Dos parejas del mismo grupo no se cruzan en la primera ronda.
// R2 (opcional). El 1.º de un grupo no se cruza con el 2.º del otro hasta semifinales.
// R3. Las dos mejores parejas por puntos solo se cruzan en la final.
//
// Devuelve los cruces en orden de llave, o null si no hay sorteo válido.
// Con "fijos" no hay sorteo: se usan las posiciones indicadas (semifinales 4 y 5 parejas).
// ---------------------------------------------------------
export function sortearLlave(
    participantes: ParticipanteLlave[],
    opciones: {
        primeroVsSegundo?: boolean;
        fijos?: [number, number][];
        intentos?: number;
    } = {}
): [string, string][] | null {
    const k = participantes.length;
    if (![2, 4, 8].includes(k)) {
        throw new Error(`Llave de ${k} parejas no soportada`);
    }

    if (opciones.fijos) {
        return opciones.fijos.map(([i, j]) => [
            participantes[i].id,
            participantes[j].id,
        ]);
    }

    if (k === 2) {
        return [[participantes[0].id, participantes[1].id]];
    }

    const { primeroVsSegundo = false, intentos = 20000 } = opciones;
    const topDos = [...participantes]
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, 2)
        .map((p) => p.id);

    for (let intento = 0; intento < intentos; intento++) {
        const orden = mezclar(participantes);

        const pares: [ParticipanteLlave, ParticipanteLlave][] = [];
        for (let i = 0; i < k; i += 2) pares.push([orden[i], orden[i + 1]]);

        // R1 y R2
        const primeraRondaValida = pares.every(([a, b]) => {
            if (a.grupo === b.grupo) return false;
            const es1y2 =
                (a.posicion === 1 && b.posicion === 2) ||
                (a.posicion === 2 && b.posicion === 1);
            if (primeroVsSegundo && es1y2) return false;
            return true;
        });
        if (!primeraRondaValida) continue;

        // R3: las dos mejores no pueden cruzarse antes de la final
        const mismaPareja = pares.some(
            ([a, b]) => topDos.includes(a.id) && topDos.includes(b.id)
        );
        if (mismaPareja) continue;

        if (k === 8) {
            const mitades = [pares.slice(0, 2), pares.slice(2, 4)].map((mitad) =>
                mitad.flat().map((p) => p.id)
            );
            if (mitades.some((ids) => topDos.every((t) => ids.includes(t)))) continue;
        }

        return pares.map(([a, b]) => [a.id, b.id]);
    }

    return null;
}

// Orden de llave para semifinales fijas de 4 y 5 parejas: 1.º–4.º y 2.º–3.º.
// Se usa con el orden de origen de FORMATOS (1A, 2A, 3A, 4A).
export const SEMIS_FIJAS: [number, number][] = [
    [0, 3],
    [1, 2],
];

export type { Origen };