import { crearClienteAdmin } from "@/lib/supabase/server";

export const PAGINA_TAMANO = 50;

export type FiltrosAuditoria = {
    accion?: string;
    tabla?: string;
    usuarioId?: string;
    desde?: string; // yyyy-mm-dd
    hasta?: string; // yyyy-mm-dd
    pagina: number;
};

export type FilaAuditoria = {
    id: number;
    usuario: string;
    accion: string;
    tabla: string;
    registroId: string | null;
    motivo: string | null;
    creadoAt: string;
};

type Fila = {
    id: number;
    usuario_id: string | null;
    accion: string;
    tabla: string;
    registro_id: string | null;
    motivo: string | null;
    created_at: string;
};

export async function listarAuditoria(f: FiltrosAuditoria): Promise<{
    filas: FilaAuditoria[];
    total: number;
    organizadores: { id: string; nombre: string }[];
}> {
    const admin = crearClienteAdmin();

    let consulta = admin
        .from("auditoria")
        .select("id, usuario_id, accion, tabla, registro_id, motivo, created_at", { count: "exact" });

    if (f.accion) consulta = consulta.eq("accion", f.accion);
    if (f.tabla) consulta = consulta.eq("tabla", f.tabla);
    if (f.usuarioId) consulta = consulta.eq("usuario_id", f.usuarioId);
    if (f.desde) consulta = consulta.gte("created_at", `${f.desde}T00:00:00`);
    if (f.hasta) consulta = consulta.lte("created_at", `${f.hasta}T23:59:59`);

    const inicio = (f.pagina - 1) * PAGINA_TAMANO;
    const { data, count, error } = await consulta
        .order("created_at", { ascending: false })
        .range(inicio, inicio + PAGINA_TAMANO - 1);
    if (error) throw new Error(error.message);

    const filas = (data ?? []) as Fila[];
    const ids = [...new Set(filas.map((x) => x.usuario_id).filter((x): x is string => Boolean(x)))];

    const { data: perfiles, error: errorPerfiles } = await admin
        .from("perfiles")
        .select("id, nombre, rol")
        .or("rol.eq.organizador" + (ids.length ? `,id.in.(${ids.join(",")})` : ""));
    if (errorPerfiles) throw new Error(errorPerfiles.message);

    const nombres = new Map(
        ((perfiles ?? []) as { id: string; nombre: string; rol: string }[]).map((p) => [p.id, p.nombre])
    );
    const organizadores = ((perfiles ?? []) as { id: string; nombre: string; rol: string }[])
        .filter((p) => p.rol === "organizador")
        .map((p) => ({ id: p.id, nombre: p.nombre || "Organizador" }));

    return {
        filas: filas.map((x) => ({
            id: x.id,
            usuario: x.usuario_id ? (nombres.get(x.usuario_id) ?? "Usuario") : "Sistema",
            accion: x.accion,
            tabla: x.tabla,
            registroId: x.registro_id,
            motivo: x.motivo,
            creadoAt: x.created_at,
        })),
        total: count ?? 0,
        organizadores,
    };
}