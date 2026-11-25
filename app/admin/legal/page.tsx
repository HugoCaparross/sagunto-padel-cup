import {
    estadoLegal,
    listarVersiones,
    type VersionDocumento,
} from "@/actions/legal";
import PanelLegal from "@/components/legal/PanelLegal";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/legal/requisitos";

export default async function PaginaLegal() {
    const estado = await estadoLegal();
    if (!estado.ok) return <p className="p-6 text-[var(--color-danger)]">{estado.error}</p>;

    const entradas = await Promise.all(
        TIPOS_DOCUMENTO.map(async (tipo) => {
            const r = await listarVersiones(tipo);
            return [tipo, r.ok ? r.versiones : []] as const;
        })
    );

    const versiones = Object.fromEntries(entradas) as Record<
        TipoDocumento,
        VersionDocumento[]
    >;
    const faltan = estado.faltan.map((r) => r.tipo);

    return (
        <main className="p-6">
            <PanelLegal versiones={versiones} faltan={faltan} />
        </main>
    );
}