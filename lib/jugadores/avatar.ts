const FONDOS = ["#F0443A", "#0D1B2A", "#A7C4A0"] as const;

export function inicialesJugador(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return "?";
    return `${palabras[0][0]}${palabras.length > 1 ? palabras[palabras.length - 1][0] : ""}`.toLocaleUpperCase("es");
}

export function colorAvatarJugador(nombre: string): (typeof FONDOS)[number] {
    const hash = [...nombre.toLocaleLowerCase("es")].reduce(
        (total, caracter) => (total * 31 + (caracter.codePointAt(0) ?? 0)) >>> 0,
        7,
    );
    return FONDOS[hash % FONDOS.length];
}
