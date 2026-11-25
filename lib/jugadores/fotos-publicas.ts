export function fotoPublicable(fila: {
    foto_perfil_path: string | null;
    visibilidad_publica: boolean;
    consentimiento_imagen: boolean;
}): string | null {
    if (!fila.visibilidad_publica || !fila.consentimiento_imagen) return null;
    return fila.foto_perfil_path ?? null;
}
