import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKENS_DISENO as t } from "@/lib/diseno/tokens";

function luminancia(hex: string): number {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a: string, b: string): number {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

const paresTexto: Array<[string, string]> = [
    [t.ink, t.fondo], [t.ink, t.surface], [t.muted, t.fondo], [t.muted, t.surface],
    [t.coralTexto, t.fondo], [t.coralTexto, t.surface], [t.navy, t.coral], [t.blanco, t.navy],
    [t.navy, t.sage], [t.exitoTexto, t.exitoBg], [t.avisoTexto, t.avisoBg],
    [t.errorTexto, t.errorBg], [t.infoTexto, t.infoBg],
];
const paresGraficos: Array<[string, string]> = [[t.bordeCampo, t.surface], [t.foco, t.surface], [t.foco, t.fondo]];

function archivosFuente(directorio: string): string[] {
    return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
        const ruta = join(directorio, entrada.name);
        if (entrada.isDirectory()) return archivosFuente(ruta);
        return /\.(tsx|css)$/.test(entrada.name) ? [ruta] : [];
    });
}

describe("contraste WCAG de la paleta SPC", () => {
    it.each(paresTexto)("alcanza 4.5:1 entre %s y %s", (a, b) => {
        expect(contraste(a, b)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(paresGraficos)("alcanza 3:1 para elementos gráficos entre %s y %s", (a, b) => {
        expect(contraste(a, b)).toBeGreaterThanOrEqual(3);
    });

    it("no usa coral, sage ni muted sobre sage como texto", () => {
        const fuente = archivosFuente(join(process.cwd(), "app")).concat(archivosFuente(join(process.cwd(), "components")))
            .map((ruta) => readFileSync(ruta, "utf8")).join("\n");
        expect(fuente).not.toMatch(/(?:text|color|fill|stroke)-\[#F0443A\]|color:\s*#F0443A/i);
        expect(fuente).not.toMatch(/(?:text|color|fill|stroke)-\[#A7C4A0\]|color:\s*#A7C4A0/i);
        expect(fuente).not.toMatch(/\btext-coral\b|\btext-sage\b/i);
        expect(fuente).not.toMatch(/color:\s*var\(--color-(?:coral|sage)\)/i);
        expect(fuente).not.toMatch(/muted[^\n]{0,80}sage/i);
    });
});
