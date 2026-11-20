// Una sola fuente para la URL pública del sitio.
// En localhost apunta a localhost; en producción, al dominio definido en NEXT_PUBLIC_SITE_URL.
export function urlBase(): string {
  const valor = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return valor.replace(/\/+$/, "");
}

export function url(ruta: string): string {
  return `${urlBase()}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}