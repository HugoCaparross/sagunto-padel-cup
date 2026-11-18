// Conversión entre horas locales de Europa/Madrid y timestamps ISO.
// Las fechas de partido se guardan como "yyyy-mm-dd" + minutos del día.

export const ZONA_HORARIA = "Europe/Madrid";

function formateador(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: ZONA_HORARIA,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// "09:00" o "09:00:00" -> minutos desde medianoche
export function aMinutos(hora: string): number {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

// Minutos desde medianoche -> "09:00"
export function aHora(minutos: number): string {
    const h = Math.floor(minutos / 60).toString().padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

// Lista de fechas "yyyy-mm-dd" entre dos fechas incluidas.
export function diasEntre(desde: string, hasta: string): string[] {
    const dias: string[] = [];
    const fin = Date.parse(`${hasta}T00:00:00Z`);
    for (let t = Date.parse(`${desde}T00:00:00Z`); t <= fin; t += 86_400_000) {
        dias.push(new Date(t).toISOString().slice(0, 10));
    }
    return dias;
}

// Fecha local + minutos del día (Madrid) -> instante ISO correcto con el horario de verano.
export function instanteMadrid(fecha: string, minutos: number): string {
    const [y, mo, d] = fecha.split("-").map(Number);
    const suposicion = Date.UTC(y, mo - 1, d, Math.floor(minutos / 60), minutos % 60);

    const partes = formateador().formatToParts(new Date(suposicion));
    const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);

    const comoUtc = Date.UTC(
        v("year"),
        v("month") - 1,
        v("day"),
        v("hour"),
        v("minute"),
        v("second")
    );
    const desfase = comoUtc - suposicion;
    return new Date(suposicion - desfase).toISOString();
}

// Instante ISO -> fecha y minutos locales de Madrid.
export function desdeInstante(iso: string): { fecha: string; minutos: number } {
    const partes = formateador().formatToParts(new Date(iso));
    const v = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
    return {
        fecha: `${v("year")}-${v("month")}-${v("day")}`,
        minutos: Number(v("hour")) * 60 + Number(v("minute")),
    };
}