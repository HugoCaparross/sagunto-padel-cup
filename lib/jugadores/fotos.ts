import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/server";

export const BUCKET_FOTOS_PERFIL = "fotos-perfil";
export const DURACION_URL_FOTO_SEGUNDOS = 900;

export async function urlsFirmadasFotos(
    rutas: readonly string[],
    duracion = DURACION_URL_FOTO_SEGUNDOS
): Promise<Map<string, string>> {
    const unicas = [...new Set(rutas.filter(Boolean))];
    if (unicas.length === 0) return new Map();

    const { data, error } = await crearClienteAdmin()
        .storage.from(BUCKET_FOTOS_PERFIL)
        .createSignedUrls(unicas, duracion);
    if (error) throw new Error(`No se pudieron cargar las fotos de perfil: ${error.message}`);

    const urls = new Map<string, string>();
    for (const foto of data ?? []) {
        if (foto.error) {
            throw new Error(`No se pudo firmar la foto ${foto.path ?? "desconocida"}: ${foto.error}`);
        }
        if (foto.path && foto.signedUrl) urls.set(foto.path, foto.signedUrl);
    }
    return urls;
}

export async function urlFirmadaFoto(path: string | null): Promise<string | null> {
    if (!path) return null;
    return (await urlsFirmadasFotos([path])).get(path) ?? null;
}
