import { crearClienteAdmin } from "@/lib/supabase/server";

// Registra un cambio del organizador. Usa la clave de servicio: el cliente no puede escribir en auditoria.
// Devuelve un mensaje de error, o null si se registró.
export async function registrarAuditoria(p: {
    usuarioId: string;
    accion: string;
    tabla: string;
    registroId: string;
    antes?: unknown;
    despues?: unknown;
    motivo?: string;
}): Promise<string | null> {
    const admin = crearClienteAdmin();
    const { error } = await admin.from("auditoria").insert({
        usuario_id: p.usuarioId,
        accion: p.accion,
        tabla: p.tabla,
        registro_id: p.registroId,
        antes: p.antes ?? null,
        despues: p.despues ?? null,
        motivo: p.motivo ?? null,
    });
    return error ? `No se pudo registrar la auditoría: ${error.message}` : null;
}