import { describe, expect, it } from "vitest";
import { ETIQUETAS_TIPO_CONTACTO, esquemaContacto } from "@/lib/validadores/contacto";

describe("tipo de contacto patrocinio", () => {
    it("acepta una consulta de patrocinio", () => {
        expect(esquemaContacto.safeParse({
            tipo: "patrocinio",
            nombre: "Empresa SPC",
            email: "patrocinio@example.com",
            mensaje: "Queremos conocer las opciones para patrocinar el circuito.",
            consentimiento: true,
        }).success).toBe(true);
    });

    it("muestra la etiqueta Patrocinio en la bandeja", () => {
        expect(ETIQUETAS_TIPO_CONTACTO.patrocinio).toBe("Patrocinio");
    });
});
