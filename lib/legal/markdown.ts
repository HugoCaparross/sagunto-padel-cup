// Convierte el subconjunto de Markdown que usan los documentos legales:
// títulos "## ", párrafos, listas con "- " y tablas con "|".
// No interpreta HTML: todo el texto se muestra como texto.

export type Bloque =
    | { tipo: "titulo"; texto: string }
    | { tipo: "parrafo"; texto: string }
    | { tipo: "lista"; items: string[] }
    | { tipo: "tabla"; cabecera: string[]; filas: string[][] };

const SEPARADOR = /^:?-{3,}:?$/;

function celdasDe(linea: string): string[] {
    return linea
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
}

export function parsearMarkdown(texto: string): Bloque[] {
    const bloques: Bloque[] = [];
    let parrafo: string[] = [];
    let items: string[] = [];
    let filasTabla: string[][] = [];

    const vaciar = () => {
        if (parrafo.length > 0) {
            bloques.push({ tipo: "parrafo", texto: parrafo.join(" ") });
        }
        if (items.length > 0) {
            bloques.push({ tipo: "lista", items });
        }
        if (filasTabla.length > 0) {
            const [cabecera, ...filas] = filasTabla;
            bloques.push({ tipo: "tabla", cabecera, filas });
        }
        parrafo = [];
        items = [];
        filasTabla = [];
    };

    for (const crudo of texto.split("\n")) {
        const linea = crudo.trim();

        if (linea === "") {
            vaciar();
            continue;
        }

        if (linea.startsWith("## ")) {
            vaciar();
            bloques.push({ tipo: "titulo", texto: linea.slice(3) });
            continue;
        }

        if (linea.startsWith("|")) {
            if (parrafo.length > 0 || items.length > 0) vaciar();
            const celdas = celdasDe(linea);
            // La fila de separación (|---|---|) no se muestra
            if (!celdas.every((c) => SEPARADOR.test(c))) filasTabla.push(celdas);
            continue;
        }

        if (linea.startsWith("- ")) {
            if (parrafo.length > 0 || filasTabla.length > 0) vaciar();
            items.push(linea.slice(2));
            continue;
        }

        if (items.length > 0 || filasTabla.length > 0) vaciar();
        parrafo.push(linea);
    }

    vaciar();
    return bloques;
}