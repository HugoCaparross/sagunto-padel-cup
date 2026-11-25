import { describe, expect, it } from "vitest";
import { esquemaCrearPrueba } from "@/lib/validadores/prueba";

const base = {
    nombre: "Prueba de calendario",
    fechaInicio: "2026-10-10",
    fechaFin: "2026-10-11",
    horaInicio: "09:00",
    horaFin: "13:00",
    sede: "Club Sagunto",
    precioCentimos: 2500,
    esMaster: false,
    categorias: ["segunda"],
    plazasMaximas: 24,
};

describe("fechas manuales de inscripción", () => {
    it("permite dejar las fechas por confirmar", () => {
        expect(esquemaCrearPrueba.safeParse(base).success).toBe(true);
    });

    it("requiere que el cierre sea posterior a la apertura", () => {
        expect(esquemaCrearPrueba.safeParse({
            ...base,
            inscripcionesAbrenAt: "2026-10-05T10:00:00.000Z",
            inscripcionesCierranAt: "2026-10-05T09:00:00.000Z",
        }).success).toBe(false);
    });

    it("requiere que el cierre sea anterior al inicio del torneo", () => {
        expect(esquemaCrearPrueba.safeParse({
            ...base,
            inscripcionesAbrenAt: "2026-10-05T10:00:00.000Z",
            inscripcionesCierranAt: "2026-10-10T10:00:00.000Z",
        }).success).toBe(false);
    });

    it("acepta fechas manuales en el orden correcto", () => {
        expect(esquemaCrearPrueba.safeParse({
            ...base,
            inscripcionesAbrenAt: "2026-10-05T10:00:00.000Z",
            inscripcionesCierranAt: "2026-10-08T10:00:00.000Z",
        }).success).toBe(true);
    });
});
