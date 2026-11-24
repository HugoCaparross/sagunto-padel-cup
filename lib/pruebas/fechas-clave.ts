const DIA_MS = 24 * 60 * 60 * 1000;

function fechaUTC(fecha: string): Date {
  const [año, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(año, mes - 1, dia, 12));
}

function formatoISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Viernes de la semana situada tres semanas antes del día del torneo. */
export function fechaAperturaInscripciones(fechaTorneo: string): string {
  const viernesObjetivo = new Date(fechaUTC(fechaTorneo).getTime() - 21 * DIA_MS);
  const diasHastaViernes = (viernesObjetivo.getUTCDay() + 2) % 7;
  viernesObjetivo.setUTCDate(viernesObjetivo.getUTCDate() - diasHastaViernes);
  return formatoISO(viernesObjetivo);
}

export function fechaCierreInscripciones(fechaTorneo: string): string {
  return formatoISO(new Date(fechaUTC(fechaTorneo).getTime() - 2 * DIA_MS));
}

export function fechaDiaPrueba(fechaTorneo: string): string {
  return fechaTorneo.slice(0, 10);
}

export function formatoFechaClave(fecha: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fechaUTC(fecha));
}
