export function formatoFechaClave(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia, 12));
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatoFechaInscripcion(fecha: string | null): string {
  if (!fecha) return "Por confirmar";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(fecha));
}
