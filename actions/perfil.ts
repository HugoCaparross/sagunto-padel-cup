"use server";

import { revalidatePath } from "next/cache";
import { registrarConsentimiento } from "@/actions/legal";
import { usuarioActual } from "@/lib/auth/organizador";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaActualizarPerfil } from "@/lib/validadores/perfil";

export type AccionPerfil = { ok: true } | { ok: false; error: string };

// Cambiar el consentimiento de imagen añade una fila nueva al historial.
// Nunca se modifica ni borra la anterior.
export async function actualizarPerfil(entrada: unknown): Promise<AccionPerfil> {
    try {
        const parseo = esquemaActualizarPerfil.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await usuarioActual();
        if (!usuarioId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };

        const supabase = await crearClienteServidor();

        const { data: previo, error: errorPrevio } = await supabase
            .from("perfiles")
            .select("consentimiento_imagen")
            .eq("id", usuarioId)
            .single<{ consentimiento_imagen: boolean }>();
        if (errorPrevio || !previo) return { ok: false, error: "No se encontró tu perfil" };

        const { error } = await supabase
            .from("perfiles")
            .update({
                nombre: d.nombre,
                talla_camiseta: d.tallaCamiseta,
                visibilidad_publica: d.visibilidadPublica,
                consentimiento_imagen: d.consentimientoImagen,
            })
            .eq("id", usuarioId);
        if (error) return { ok: false, error: "No se pudo guardar el perfil" };

        if (previo.consentimiento_imagen !== d.consentimientoImagen) {
            const r = await registrarConsentimiento({
                tipo: "imagen",
                concedido: d.consentimientoImagen,
            });
            if (!r.ok) return { ok: false, error: r.error };
        }

        revalidatePath("/cuenta");
        revalidatePath("/cuenta/perfil");
        revalidatePath("/ranking");
        revalidatePath("/jugadores");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}