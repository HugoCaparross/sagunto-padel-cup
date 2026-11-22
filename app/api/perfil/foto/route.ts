import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth/organizador";
import { BUCKET_FOTOS_PERFIL, DURACION_URL_FOTO_SEGUNDOS } from "@/lib/jugadores/fotos";
import { crearClienteAdmin } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
} as const;

type MimePermitido = keyof typeof EXTENSIONES;

function respuestaError(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

function migracionPendiente(error: { code?: string } | null) {
    return error?.code === "42703"
        ? respuestaError(
              "La base de datos aún no está preparada para guardar fotos. Aplica la migración de fotos de perfil.",
              503
          )
        : null;
}

function firmaValida(bytes: Uint8Array, mime: MimePermitido): boolean {
    if (mime === "image/jpeg") {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }
    if (mime === "image/png") {
        return (
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0d &&
            bytes[5] === 0x0a &&
            bytes[6] === 0x1a &&
            bytes[7] === 0x0a
        );
    }
    return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    );
}

function revalidarPerfil() {
    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/cuenta/perfil");
    revalidatePath("/jugadores");
}

export async function POST(request: Request) {
    const usuarioId = await usuarioActual();
    if (!usuarioId) return respuestaError("Inicia sesión para actualizar tu foto.", 401);

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES + 64 * 1024) {
        return respuestaError("La foto no puede superar los 5 MB.", 413);
    }

    const formData = await request.formData();
    const foto = formData.get("foto");
    if (!(foto instanceof File)) return respuestaError("Selecciona una foto válida.", 400);
    if (foto.size === 0 || foto.size > MAX_BYTES) {
        return respuestaError("La foto debe pesar menos de 5 MB.", 413);
    }
    if (!Object.hasOwn(EXTENSIONES, foto.type)) {
        return respuestaError("Usa una foto JPG, PNG o WebP.", 415);
    }

    const mime = foto.type as MimePermitido;
    const bytes = new Uint8Array(await foto.arrayBuffer());
    if (!firmaValida(bytes, mime)) {
        return respuestaError("El archivo no contiene una imagen válida.", 415);
    }

    const admin = crearClienteAdmin();
    const { data: perfil, error: errorPerfil } = await admin
        .from("perfiles")
        .select("visibilidad_publica, foto_perfil_path")
        .eq("id", usuarioId)
        .maybeSingle<{ visibilidad_publica: boolean; foto_perfil_path: string | null }>();
    const respuestaMigracion = migracionPendiente(errorPerfil);
    if (respuestaMigracion) return respuestaMigracion;
    if (errorPerfil) return respuestaError("No se pudo comprobar la privacidad del perfil.", 500);
    if (!perfil) return respuestaError("No se encontró el perfil.", 404);
    if (!perfil.visibilidad_publica) {
        return respuestaError("Activa la visibilidad pública del perfil para añadir una foto.", 403);
    }

    const ruta = `${usuarioId}/${crypto.randomUUID()}.${EXTENSIONES[mime]}`;
    const almacen = admin.storage.from(BUCKET_FOTOS_PERFIL);
    const { error: errorSubida } = await almacen.upload(ruta, foto, {
        cacheControl: String(DURACION_URL_FOTO_SEGUNDOS),
        contentType: mime,
        upsert: false,
    });
    if (errorSubida) return respuestaError("No se pudo subir la foto. Inténtalo de nuevo.", 500);

    const { data: fotoFirmada, error: errorFirma } = await almacen.createSignedUrl(
        ruta,
        DURACION_URL_FOTO_SEGUNDOS
    );
    if (errorFirma) {
        const { error: errorLimpieza } = await almacen.remove([ruta]);
        const detalle = errorLimpieza ? " y limpiar el archivo temporal" : "";
        return respuestaError(`No se pudo preparar la foto${detalle}.`, 500);
    }

    const { error: errorActualizacion } = await admin
        .from("perfiles")
        .update({ foto_perfil_path: ruta })
        .eq("id", usuarioId);
    if (errorActualizacion) {
        const { error: errorLimpieza } = await almacen.remove([ruta]);
        const detalle = errorLimpieza ? " Tampoco se pudo limpiar el archivo temporal." : "";
        const respuestaMigracion = migracionPendiente(errorActualizacion);
        if (respuestaMigracion) {
            return errorLimpieza
                ? respuestaError(
                      "La base de datos aún no está preparada para guardar fotos. Aplica la migración; tampoco se pudo limpiar el archivo temporal.",
                      503
                  )
                : respuestaMigracion;
        }
        return respuestaError(`No se pudo guardar la foto.${detalle}`, 500);
    }

    let aviso: string | null = null;
    if (perfil.foto_perfil_path && perfil.foto_perfil_path !== ruta) {
        const { error: errorRetirada } = await almacen.remove([perfil.foto_perfil_path]);
        if (errorRetirada) aviso = "La foto se actualizó, pero no se pudo retirar el archivo anterior.";
    }

    revalidarPerfil();
    return NextResponse.json({ fotoUrl: fotoFirmada.signedUrl, aviso });
}

export async function DELETE() {
    const usuarioId = await usuarioActual();
    if (!usuarioId) return respuestaError("Inicia sesión para actualizar tu foto.", 401);

    const admin = crearClienteAdmin();
    const { data: perfil, error: errorPerfil } = await admin
        .from("perfiles")
        .select("foto_perfil_path")
        .eq("id", usuarioId)
        .maybeSingle<{ foto_perfil_path: string | null }>();
    const respuestaMigracion = migracionPendiente(errorPerfil);
    if (respuestaMigracion) return respuestaMigracion;
    if (errorPerfil) return respuestaError("No se pudo leer la foto del perfil.", 500);
    if (!perfil) return respuestaError("No se encontró el perfil.", 404);

    const { error: errorActualizacion } = await admin
        .from("perfiles")
        .update({ foto_perfil_path: null })
        .eq("id", usuarioId);
    const respuestaMigracionActualizacion = migracionPendiente(errorActualizacion);
    if (respuestaMigracionActualizacion) return respuestaMigracionActualizacion;
    if (errorActualizacion) return respuestaError("No se pudo retirar la foto del perfil.", 500);

    let aviso: string | null = null;
    if (perfil.foto_perfil_path?.startsWith(`${usuarioId}/`)) {
        const { error: errorRetirada } = await admin.storage
            .from(BUCKET_FOTOS_PERFIL)
            .remove([perfil.foto_perfil_path]);
        if (errorRetirada) aviso = "La foto dejó de mostrarse, pero no se pudo borrar el archivo.";
    }

    revalidarPerfil();
    return NextResponse.json({ aviso });
}
