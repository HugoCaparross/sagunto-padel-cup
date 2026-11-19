import { notFound } from "next/navigation";
import { obtenerDocumentoVigente } from "@/actions/legal";
import { fechaLarga } from "@/lib/formato";
import { parsearMarkdown, type Bloque } from "@/lib/legal/markdown";
import type { TipoDocumento } from "@/lib/legal/requisitos";

function BloqueLegal({ bloque }: { bloque: Bloque }) {
    switch (bloque.tipo) {
        case "titulo":
            return <h2 className="pt-4 text-xl font-semibold">{bloque.texto}</h2>;

        case "parrafo":
            return <p className="leading-relaxed">{bloque.texto}</p>;

        case "lista":
            return (
                <ul className="list-disc space-y-1 pl-6">
                    {bloque.items.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            );

        case "tabla":
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F5F4] text-left">
                            <tr>
                                {bloque.cabecera.map((c, i) => (
                                    <th key={i} className="px-3 py-2 font-medium">
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bloque.filas.map((fila, i) => (
                                <tr key={i} className="border-t border-[#D5D9DC]">
                                    {fila.map((celda, j) => (
                                        <td key={j} className="px-3 py-2 align-top">
                                            {celda}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
    }
}

export default async function DocumentoLegal({ tipo }: { tipo: TipoDocumento }) {
    const doc = await obtenerDocumentoVigente(tipo);
    if (!doc) notFound();

    return (
        <article className="mx-auto max-w-[720px] space-y-5 px-4 py-12 text-[#18232D]">
            <header className="space-y-1 border-b border-[#D5D9DC] pb-6">
                <h1 className="text-3xl font-semibold">{doc.titulo}</h1>
                <p className="text-sm text-[#68737D]">
                    Versión {doc.version} · publicada el {fechaLarga(doc.publicadoAt)}
                </p>
            </header>

            {parsearMarkdown(doc.contenido).map((bloque, i) => (
                <BloqueLegal key={i} bloque={bloque} />
            ))}
        </article>
    );
}