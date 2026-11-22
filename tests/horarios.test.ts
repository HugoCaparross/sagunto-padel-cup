import { describe, expect, it } from "vitest";
import {
    CONFIG_POR_DEFECTO,
    estimarPrueba,
    maximoParejasParejo,
    minutosDisponibles,
} from "@/lib/horarios/capacidad";
import { aHora, aMinutos, desdeInstante, diasEntre, instanteMadrid } from "@/lib/horarios/tiempo";

describe("capacidad de la prueba", () => {
    it("con 4 pistas, 2 días de 4 horas hay 1920 minutos", () => {
        expect(minutosDisponibles(CONFIG_POR_DEFECTO)).toBe(1920);
    });

    it("3 parejas por categoría caben con la configuración por defecto", () => {
        const e = estimarPrueba({ primera: 3, segunda: 3, tercera: 3, cuarta: 3 });
        expect(e.cabe).toBe(true);
        expect(e.holguraMin).toBe(40);
    });

    it("con 4 pistas, el máximo es 3 parejas por categoría", () => {
        expect(maximoParejasParejo(CONFIG_POR_DEFECTO)).toEqual({ porCategoria: 3, total: 12 });
    });

    it("con 6 pistas, el máximo es 4 parejas por categoría", () => {
        expect(maximoParejasParejo({ ...CONFIG_POR_DEFECTO, pistas: 6 })).toEqual({
            porCategoria: 4,
            total: 16,
        });
    });
});

describe("tiempo en Madrid", () => {
    it("convierte horas a minutos y viceversa", () => {
        expect(aMinutos("09:30")).toBe(570);
        expect(aHora(570)).toBe("09:30");
    });

    it("genera los días de una prueba", () => {
        expect(diasEntre("2026-09-12", "2026-09-13")).toEqual(["2026-09-12", "2026-09-13"]);
    });

    it("aplica el horario de verano y el de invierno", () => {
        expect(instanteMadrid("2026-09-12", 9 * 60)).toBe("2026-09-12T07:00:00.000Z");
        expect(instanteMadrid("2027-01-23", 9 * 60)).toBe("2027-01-23T08:00:00.000Z");
    });

    it("vuelve de un instante a fecha y minutos locales", () => {
        expect(desdeInstante("2026-09-12T07:00:00.000Z")).toEqual({
            fecha: "2026-09-12",
            minutos: 540,
        });
    });
});