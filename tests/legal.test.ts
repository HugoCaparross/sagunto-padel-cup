import { describe, expect, it } from "vitest";
import { DOCUMENTOS_INICIALES } from "@/lib/legal/contenido";
import { REQUISITOS } from "@/lib/legal/requisitos";

describe("textos públicos de titularidad", () => {
    it("no publican datos personales de Hugo Caparrós", () => {
        const textos = [
            ...Object.values(DOCUMENTOS_INICIALES).map((documento) => documento.contenido),
            ...REQUISITOS.flatMap((requisito) => [
                requisito.nombre,
                ...requisito.contenidoMinimo,
                ...requisito.palabrasClave,
            ]),
        ];

        expect(textos.join("\n")).not.toContain("Caparr");
    });
});
