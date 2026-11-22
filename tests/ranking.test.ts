import { describe, expect, it } from "vitest";
import {
    calcularRanking,
    calcularRankingGeneral,
    clasificadosMaster,
    inicioVentana,
    type RegistroPartido,
    type RegistroPuntos,
} from "@/lib/ranking/calcular";
import { compararEstadisticas, type EstadisticasPareja } from "@/lib/ranking/desempate";

const REF = "2026-11-20";

function punto(
    clave: string,
    pruebaId: string,
    fecha: string,
    ronda: RegistroPuntos["ronda"],
    puntos: number
): RegistroPuntos {
    return { clave, pruebaId, fecha, categoria: "segunda", ronda, puntos };
}

function pareja(over: Partial<EstadisticasPareja>): EstadisticasPareja {
    return {
        clave: "x",
        puntos: 0,
        primeros: 0,
        segundos: 0,
        terceros: 0,
        mejorRonda: null,
        victorias: 0,
        ...over,
    };
}

describe("ventana móvil de 12 meses", () => {
    it("el inicio es 12 meses antes de la referencia", () => {
        expect(inicioVentana(REF)).toBe("2025-11-20");
    });

    it("un resultado deja de contar exactamente 12 meses después", () => {
        const puntos = [
            punto("a", "p1", "2025-11-20", "campeon", 125), // caduca hoy: no cuenta
            punto("a", "p2", "2025-11-21", "participacion", 18), // todavía cuenta
        ];
        const [fila] = calcularRanking({ categoria: "segunda", referencia: REF, puntos, partidos: [] });
        expect(fila.puntos).toBe(18);
        expect(fila.pruebasJugadas).toBe(1);
    });
});

describe("ranking", () => {
    it("el ranking general suma puntos de todas las categorías", () => {
        const puntos = [
            { ...punto("a", "p1", "2026-10-01", "campeon", 100), categoria: "primera" as const },
            { ...punto("a", "p1", "2026-10-01", "subcampeon", 40), categoria: "segunda" as const },
            { ...punto("a", "p2", "2026-11-01", "participacion", 18), categoria: "tercera" as const },
            { ...punto("b", "p1", "2026-10-01", "campeon", 125), categoria: "cuarta" as const },
        ];

        const filas = calcularRankingGeneral({ referencia: REF, puntos, partidos: [] });

        expect(filas.map((fila) => [fila.clave, fila.puntos, fila.pruebasJugadas])).toEqual([
            ["a", 158, 2],
            ["b", 125, 1],
        ]);
    });

    it("con los mismos puntos, gana quien tiene más primeros puestos", () => {
        const puntos = [
            punto("a", "p1", "2026-10-01", "campeon", 100),
            punto("a", "p2", "2026-11-01", "participacion", 25),
            punto("b", "p1", "2026-10-01", "subcampeon", 125),
            punto("c", "p1", "2026-10-01", "participacion", 60),
        ];
        const filas = calcularRanking({ categoria: "segunda", referencia: REF, puntos, partidos: [] });
        expect(filas.map((f) => f.clave)).toEqual(["a", "b", "c"]);
    });

    it("empates completos comparten posición y saltan el número", () => {
        const puntos = [
            punto("a", "p1", "2026-10-01", "cuartos", 85),
            punto("b", "p1", "2026-10-01", "cuartos", 85),
            punto("c", "p1", "2026-10-01", "participacion", 18),
        ];
        const filas = calcularRanking({ categoria: "segunda", referencia: REF, puntos, partidos: [] });
        expect(filas.map((f) => f.posicion)).toEqual([1, 1, 3]);
    });

    it("cuenta victorias y calcula el porcentaje", () => {
        const partidos: RegistroPartido[] = [
            { clave: "a", fecha: "2026-10-01", categoria: "segunda", ganado: true },
            { clave: "a", fecha: "2026-10-02", categoria: "segunda", ganado: false },
            { clave: "a", fecha: "2026-10-03", categoria: "segunda", ganado: true },
            { clave: "a", fecha: "2026-10-04", categoria: "segunda", ganado: true },
        ];
        const puntos = [punto("a", "p1", "2026-10-01", "participacion", 18)];
        const [fila] = calcularRanking({ categoria: "segunda", referencia: REF, puntos, partidos });
        expect(fila.victorias).toBe(3);
        expect(fila.partidos).toBe(4);
        expect(fila.porcentajeVictorias).toBe(75);
    });

    it("el Máster exige 2 pruebas y se queda con el top 6", () => {
        const puntos: RegistroPuntos[] = [];
        for (let i = 1; i <= 7; i++) {
            puntos.push(punto(`p${i}`, "x", "2026-10-01", "participacion", 100 - i * 5));
            puntos.push(punto(`p${i}`, "y", "2026-10-02", "participacion", 1));
        }
        // Más puntos que nadie, pero solo una prueba: no entra
        puntos.push(punto("p8", "x", "2026-10-01", "campeon", 200));

        const filas = calcularRanking({ categoria: "segunda", referencia: REF, puntos, partidos: [] });
        const clasificados = clasificadosMaster(filas).map((f) => f.clave);
        expect(clasificados).toEqual(["p1", "p2", "p3", "p4", "p5", "p6"]);
    });
});

describe("desempate", () => {
    it("los puntos mandan sobre todo lo demás", () => {
        expect(compararEstadisticas(pareja({ puntos: 20 }), pareja({ puntos: 10, primeros: 5 }))).toBeLessThan(0);
    });

    it("con los mismos puntos, gana más primeros puestos", () => {
        expect(compararEstadisticas(pareja({ puntos: 10 }), pareja({ puntos: 10, primeros: 1 }))).toBeGreaterThan(0);
    });

    it("con todo igual, gana la mejor ronda alcanzada", () => {
        const a = pareja({ puntos: 10, mejorRonda: "semifinalista" });
        const b = pareja({ puntos: 10, mejorRonda: "cuartos" });
        expect(compararEstadisticas(a, b)).toBeLessThan(0);
    });

    it("como último criterio, las victorias", () => {
        expect(compararEstadisticas(pareja({ victorias: 3 }), pareja({ victorias: 2 }))).toBeLessThan(0);
    });
});