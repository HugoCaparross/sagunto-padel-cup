"use server";

import { exigirOrganizador } from "@/lib/auth/organizador";
import { DOCUMENTOS_INICIALES } from "@/lib/legal/contenido";
import { crearVersion, estadoLegal, publicarVersion } from "@/actions/legal";

export type ResultadoCarga =
    | { ok: true; publicados: string[] }
    | { ok: false; error: string };

// Publica los documentos iniciales que todavía no tengan una versión vigente.
// No sustituye nunca un documento ya publicado.
export async function publicarDocumentosIniciales(): Promise<ResultadoCarga> {
    try {
        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };

        const estado = await estadoLegal();
        if (!estado.ok) return { ok: false, error: estado.error };

        const publicados: string[] = [];

        for (const requisito of estado.faltan) {
            const doc = DOCUMENTOS_INICIALES[requisito.tipo];

            const creada = await crearVersion({
                tipo: requisito.tipo,
                titulo: doc.titulo,
                contenido: doc.contenido,
            });
            if (!creada.ok) return { ok: false, error: `${requisito.nombre}: ${creada.error}` };
            if (!creada.id) return { ok: false, error: `${requisito.nombre}: no se creó la versión` };

            const pub = await publicarVersion({ id: creada.id });
            if (!pub.ok) return { ok: false, error: `${requisito.nombre}: ${pub.error}` };

            publicados.push(requisito.nombre);
        }

        return { ok: true, publicados };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}