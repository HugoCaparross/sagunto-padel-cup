// Formato para la web en español de España.

const ZONA = "Europe/Madrid";

const fechaLargaFmt = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
});

const fechaCortaFmt = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA,
});

const euroFmt = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

function aFecha(valor: string | Date): Date {
    if (valor instanceof Date) return valor;
    // Las fechas de solo día se fijan al mediodía UTC para que no cambien de día en ningún huso.
    return /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? new Date(`${valor}T12:00:00Z`)
        : new Date(valor);
}

// "2026-09-12" -> "12 de septiembre de 2026"
export function fechaLarga(valor: string | Date): string {
    return fechaLargaFmt.format(aFecha(valor));
}

export function fechaRangoPrueba(inicio: string | Date, fin: string | Date): string {
    const fechaInicio = fechaLarga(inicio);
    return fechaInicio === fechaLarga(fin) ? fechaInicio : `${fechaInicio} – ${fechaLarga(fin)}`;
}

// "2026-09-12" -> "12/09/2026"
export function fechaCorta(valor: string | Date): string {
    return fechaCortaFmt.format(aFecha(valor));
}

// 2500 (céntimos) -> "25,00 €"
export function euros(centimos: number): string {
    return euroFmt.format(centimos / 100);
}

// "Cómo me inscribo: ¡Ya!" -> "como-me-inscribo-ya"
export function slugificar(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}
