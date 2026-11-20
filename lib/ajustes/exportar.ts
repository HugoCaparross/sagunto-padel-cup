// CSV para Excel en español: separador ";", valores entre comillas si hace falta.
export function aCsv(cabecera: string[], filas: (string | number | boolean | null)[][]): string {
    const celda = (v: string | number | boolean | null): string => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [cabecera, ...filas].map((fila) => fila.map(celda).join(";")).join("\r\n");
}