// Evita redirecciones a otros dominios: solo acepta rutas internas.
export function rutaSegura(destino: string | null | undefined, porDefecto = "/cuenta"): string {
    if (!destino) return porDefecto;
    if (!destino.startsWith("/") || destino.startsWith("//")) return porDefecto;
    return destino;
}