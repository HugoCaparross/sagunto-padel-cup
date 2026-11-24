export function crearSlugJugador(nombre: string | null | undefined, id: string): string {
    const base = (nombre?.trim() || "jugador")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    return `${base || "jugador"}-${id.slice(0, 6).toLowerCase()}`;
}
