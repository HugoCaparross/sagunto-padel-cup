"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOrganizador, usuarioActual } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import {
    RUTA_DOCUMENTO,
    faltantes,
    palabrasQueFaltan,
    type Requisito,
    type TipoDocumento,
} from "@/lib/legal/requisitos";
import {
    esquemaConsentimiento,
    esquemaCrearVersion,
    esquemaPublicarVersion,
    esquemaTipoDocumento,
    type TipoConsentimiento,
} from "@/lib/validadores/legal";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type DocumentoVigente = {
    id: string;
    tipo: TipoDocumento;
    version: number;
    titulo: string;
    contenido: string;
    publicadoAt: string;
};

export type VersionDocumento = {
    id: string;
    tipo: TipoDocumento;
    version: number;
    titulo: string;
    vigente: boolean;
    publicadoAt: string | null;
    creadoAt: string;
};

export type EstadoLegal =
    | {
        ok: true;
        vigentes: { tipo: TipoDocumento; version: number }[];
        faltan: Requisito[];
    }
    | { ok: false; error: string };

export type ConsentimientoFila = {
    id: number;
    tipo: TipoConsentimiento;
    concedido: boolean;
    documentoId: string | null;
    registradoAt: string;
};

export type AccionLegal =
    | { ok: true; id?: string; avisos?: string[] }
    | { ok: false; error: string };

type FilaVersion = {
    id: string;
    tipo: TipoDocumento;
    version: number;
    titulo: string;
    contenido?: string;
    vigente: boolean;
    publicado_at: string | null;
    created_at: string;
};

// Versión a publicar: se lee con tipo explícito para poder indexar RUTA_DOCUMENTO.
type VersionPublicable = {
    id: string;
    tipo: TipoDocumento;
    version: number;
    vigente: boolean;
};

// Documento que cada consentimiento necesita como referencia.
// La mayoría de edad y la imagen no se apoyan en un documento de la web.
const DOCUMENTO_DE_CONSENTIMIENTO: Record<TipoConsentimiento, TipoDocumento | null> = {
    privacidad: "privacidad",
    imagen: null,
    cookies_analitica: "cookies",
    comunicaciones: "privacidad",
    mayoria_o_tutor: null,
};

function errorBD(e: { code?: string; message: string }): string {
    return e.code === "23505"
        ? "Otra persona ha creado una versión a la vez. Recarga y vuelve a intentarlo."
        : e.message;
}

// ---------------------------------------------------------
// LECTURA PÚBLICA
// ---------------------------------------------------------
export async function obtenerDocumentoVigente(
    tipo: unknown
): Promise<DocumentoVigente | null> {
    const parseo = esquemaTipoDocumento.safeParse(tipo);
    if (!parseo.success) return null;

    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from("documentos_legales")
        .select("id, tipo, version, titulo, contenido, publicado_at")
        .eq("tipo", parseo.data)
        .eq("vigente", true)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
        id: data.id,
        tipo: data.tipo as TipoDocumento,
        version: data.version,
        titulo: data.titulo,
        contenido: data.contenido,
        publicadoAt: data.publicado_at,
    };
}

// ---------------------------------------------------------
// ORGANIZADOR
// ---------------------------------------------------------
export async function estadoLegal(): Promise<EstadoLegal> {
    try {
        if (!(await exigirOrganizador())) {
            return { ok: false, error: "No autorizado" };
        }

        const supabase = await crearClienteServidor();

        const { data, error } = await supabase
            .from("documentos_legales")
            .select("tipo, version")
            .eq("vigente", true);

        if (error) {
            return { ok: false, error: error.message };
        }

        const vigentes = (data ?? []) as {
            tipo: TipoDocumento;
            version: number;
        }[];

        return {
            ok: true,
            vigentes,
            faltan: faltantes(vigentes.map((v) => v.tipo)),
        };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}

export async function listarVersiones(
    tipo: unknown
): Promise<
    { ok: true; versiones: VersionDocumento[] }
    | { ok: false; error: string }
> {
    try {
        const parseo = esquemaTipoDocumento.safeParse(tipo);

        if (!parseo.success) {
            return {
                ok: false,
                error: parseo.error.issues[0].message,
            };
        }

        if (!(await exigirOrganizador())) {
            return { ok: false, error: "No autorizado" };
        }

        const supabase = await crearClienteServidor();

        const { data, error } = await supabase
            .from("documentos_legales")
            .select(
                "id, tipo, version, titulo, vigente, publicado_at, created_at"
            )
            .eq("tipo", parseo.data)
            .order("version", { ascending: false });

        if (error) {
            return { ok: false, error: error.message };
        }

        return {
            ok: true,
            versiones: ((data ?? []) as FilaVersion[]).map((f) => ({
                id: f.id,
                tipo: f.tipo,
                version: f.version,
                titulo: f.titulo,
                vigente: f.vigente,
                publicadoAt: f.publicado_at,
                creadoAt: f.created_at,
            })),
        };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}

// Crea una versión nueva en borrador. No cambia la que está vigente.
// Devuelve avisos si el texto no menciona algo que debe contener.
export async function crearVersion(
    entrada: unknown
): Promise<AccionLegal> {
    try {
        const parseo = esquemaCrearVersion.safeParse(entrada);

        if (!parseo.success) {
            return {
                ok: false,
                error: parseo.error.issues[0].message,
            };
        }

        const d = parseo.data;

        const usuarioId = await exigirOrganizador();

        if (!usuarioId) {
            return { ok: false, error: "No autorizado" };
        }

        const admin = crearClienteAdmin();

        const { data: ultima, error: errorUltima } = await admin
            .from("documentos_legales")
            .select("version")
            .eq("tipo", d.tipo)
            .order("version", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (errorUltima) {
            return { ok: false, error: errorUltima.message };
        }

        const version = (ultima?.version ?? 0) + 1;

        const { data, error } = await admin
            .from("documentos_legales")
            .insert({
                tipo: d.tipo,
                version,
                titulo: d.titulo,
                contenido: d.contenido,
                vigente: false,
            })
            .select("id")
            .single();

        if (error) {
            return { ok: false, error: errorBD(error) };
        }

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "crear_version_legal",
            tabla: "documentos_legales",
            registroId: data.id,
            despues: {
                tipo: d.tipo,
                version,
            },
        });

        if (errorAuditoria) {
            return { ok: false, error: errorAuditoria };
        }

        const avisos = palabrasQueFaltan(d.tipo, d.contenido).map(
            (p) => `El texto no menciona "${p}". Revísalo antes de publicar.`
        );

        revalidatePath("/admin/legal");

        return {
            ok: true,
            id: data.id,
            avisos,
        };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}

// Publica una versión y retira la vigente anterior del mismo tipo.
// Primero se retira la anterior, para no chocar con el índice único de vigentes.
export async function publicarVersion(
    entrada: unknown
): Promise<AccionLegal> {
    try {
        const parseo = esquemaPublicarVersion.safeParse(entrada);

        if (!parseo.success) {
            return {
                ok: false,
                error: parseo.error.issues[0].message,
            };
        }

        const { id } = parseo.data;

        const usuarioId = await exigirOrganizador();

        if (!usuarioId) {
            return { ok: false, error: "No autorizado" };
        }

        const admin = crearClienteAdmin();

        const { data: objetivo, error: errorObjetivo } = await admin
            .from("documentos_legales")
            .select("id, tipo, version, vigente")
            .eq("id", id)
            .single<VersionPublicable>();

        if (errorObjetivo || !objetivo) {
            return { ok: false, error: "Versión no encontrada" };
        }

        if (objetivo.vigente) {
            return { ok: true, id };
        }

        const { data: anterior, error: errorAnterior } = await admin
            .from("documentos_legales")
            .select("id, version")
            .eq("tipo", objetivo.tipo)
            .eq("vigente", true)
            .maybeSingle();

        if (errorAnterior) {
            return { ok: false, error: errorAnterior.message };
        }

        if (anterior) {
            const { error } = await admin
                .from("documentos_legales")
                .update({ vigente: false })
                .eq("id", anterior.id);

            if (error) {
                return { ok: false, error: errorBD(error) };
            }
        }

        const { error: errorPublicar } = await admin
            .from("documentos_legales")
            .update({
                vigente: true,
                publicado_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (errorPublicar) {
            // Si falla, se restaura la anterior para que el tipo no quede sin documento vigente
            if (anterior) {
                await admin
                    .from("documentos_legales")
                    .update({ vigente: true })
                    .eq("id", anterior.id);
            }

            return {
                ok: false,
                error: errorBD(errorPublicar),
            };
        }

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "publicar_version_legal",
            tabla: "documentos_legales",
            registroId: id,
            antes: anterior
                ? { versionVigente: anterior.version }
                : null,
            despues: {
                tipo: objetivo.tipo,
                versionVigente: objetivo.version,
            },
        });

        if (errorAuditoria) {
            return { ok: false, error: errorAuditoria };
        }

        revalidatePath(RUTA_DOCUMENTO[objetivo.tipo]);
        revalidatePath("/admin/legal");

        return { ok: true, id };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}

// ---------------------------------------------------------
// CONSENTIMIENTOS DEL JUGADOR
// Solo se añaden filas: nunca se modifica ni borra un consentimiento anterior.
// Revocar es insertar una fila con concedido = false.
// ---------------------------------------------------------
export async function registrarConsentimiento(
    entrada: unknown
): Promise<AccionLegal> {
    try {
        const parseo = esquemaConsentimiento.safeParse(entrada);

        if (!parseo.success) {
            return {
                ok: false,
                error: parseo.error.issues[0].message,
            };
        }

        const d = parseo.data;

        const usuarioId = await usuarioActual();

        if (!usuarioId) {
            return {
                ok: false,
                error: "Inicia sesión para registrar tu consentimiento",
            };
        }

        const supabase = await crearClienteServidor();

        let documentoId: string | null = d.documentoId ?? null;

        if (documentoId) {
            const { data: doc, error } = await supabase
                .from("documentos_legales")
                .select("id")
                .eq("id", documentoId)
                .maybeSingle();

            if (error) {
                return { ok: false, error: error.message };
            }

            if (!doc) {
                return { ok: false, error: "Documento no válido" };
            }
        } else {
            const tipoDoc = DOCUMENTO_DE_CONSENTIMIENTO[d.tipo];

            if (tipoDoc) {
                const { data: vigente, error } = await supabase
                    .from("documentos_legales")
                    .select("id")
                    .eq("tipo", tipoDoc)
                    .eq("vigente", true)
                    .maybeSingle();

                if (error) {
                    return { ok: false, error: error.message };
                }

                if (!vigente) {
                    return {
                        ok: false,
                        error: "Todavía no hay una versión publicada de ese documento",
                    };
                }

                documentoId = vigente.id;
            }
        }

        const { error } = await supabase
            .from("consentimientos")
            .insert({
                perfil_id: usuarioId,
                tipo: d.tipo,
                documento_id: documentoId,
                concedido: d.concedido,
            });

        if (error) {
            return { ok: false, error: error.message };
        }

        return { ok: true };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}

export async function historialConsentimientos(): Promise<
    { ok: true; filas: ConsentimientoFila[] }
    | { ok: false; error: string }
> {
    try {
        const usuarioId = await usuarioActual();

        if (!usuarioId) {
            return {
                ok: false,
                error: "Inicia sesión para ver tus consentimientos",
            };
        }

        const supabase = await crearClienteServidor();

        const { data, error } = await supabase
            .from("consentimientos")
            .select("id, tipo, concedido, documento_id, registrado_at")
            .eq("perfil_id", usuarioId)
            .order("registrado_at", { ascending: false });

        if (error) {
            return { ok: false, error: error.message };
        }

        return {
            ok: true,
            filas: (data ?? []).map((f) => ({
                id: f.id,
                tipo: f.tipo as TipoConsentimiento,
                concedido: f.concedido,
                documentoId: f.documento_id,
                registradoAt: f.registrado_at,
            })),
        };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : "Error inesperado",
        };
    }
}