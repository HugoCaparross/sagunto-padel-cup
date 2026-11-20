import { describe, expect, it } from "vitest";
import { duelos, type PartidoHistorial } from "@/lib/estadisticas/calcular";
import { euros, fechaLarga, slugificar } from "@/lib/formato";
import { faltantes, palabrasQueFaltan } from "@/lib/legal/requisitos";
import { calcularXp, progresoDesdeXp, tierDeNivel, xpParaNivel } from "@/lib/xp/niveles";

describe("niveles y XP", () => {
    it("el XP necesario crece como 25 × n × (n − 1)", () => {
        expect(xpParaNivel(2)).toBe(50);
        expect(xpParaNivel(5)).toBe(500);
        expect(xpParaNivel(10)).toBe(2250);
    });

    it("el nivel sube al alcanzar el XP exacto", () => {
        expect(progresoDesdeXp(0).nivel).toBe(1);
        expect(progresoDesdeXp(49).nivel).toBe(1);
        expect(progresoDesdeXp(50).nivel).toBe(2);
    });

    it("el bonus de victorias solo cuenta con 5 partidos o más", () => {
        const base = { puntosHistoricos: 0, pruebasJugadas: 0, porcentajeVictorias: 100 };
        expect(calcularXp({ ...base, partidos: 4 })).toBe(0);
        expect(calcularXp({ ...base, partidos: 5 })).toBe(100);
    });

    it("asigna el tier según el nivel", () => {
        expect(tierDeNivel(1).nombre).toBe("Iniciado");
        expect(tierDeNivel(10).nombre).toBe("Regular");
        expect(tierDeNivel(50).nombre).toBe("Leyenda");
    });
});

describe("duelos entre jugadores", () => {
    const partido: PartidoHistorial = {
        id: "1",
        pruebaId: "p",
        ladoA: ["x1", "x2"],
        ladoB: ["y1", "y2"],
        sets: [[6, 4], [6, 3]],
        ganador: "A",
    };

    it("en modo contiene cuenta al jugador con cualquier compañero", () => {
        expect(duelos([partido], ["x1"], ["y1"], "contiene")).toEqual({
            partidos: 1,
            victoriasA: 1,
            victoriasB: 0,
        });
    });

    it("en modo exacto solo cuenta la misma pareja", () => {
        expect(duelos([partido], ["x1"], ["y1"], "exacto")).toEqual({
            partidos: 0,
            victoriasA: 0,
            victoriasB: 0,
        });
        expect(duelos([partido], ["x1", "x2"], ["y1", "y2"], "exacto")).toEqual({
            partidos: 1,
            victoriasA: 1,
            victoriasB: 0,
        });
    });
});

describe("requisitos legales", () => {
    it("detecta las palabras clave que falten en un texto", () => {
        expect(palabrasQueFaltan("aviso_legal", "Contacto: x@y.es. Propiedad intelectual de todo.")).toEqual([]);
        expect(palabrasQueFaltan("privacidad", "Texto sin nada")).toHaveLength(3);
    });

    it("lista los documentos que faltan por publicar", () => {
        expect(faltantes(["aviso_legal", "privacidad"])).toHaveLength(3);
    });
});

describe("formato", () => {
    it("genera slugs sin tildes ni signos", () => {
        expect(slugificar("¡Cómo me inscribo: ya!")).toBe("como-me-inscribo-ya");
    });

    it("muestra los euros en formato español", () => {
        expect(euros(2500)).toContain("25,00");
    });

    it("escribe las fechas largas en español", () => {
        expect(fechaLarga("2026-09-12")).toBe("12 de septiembre de 2026");
    });
});