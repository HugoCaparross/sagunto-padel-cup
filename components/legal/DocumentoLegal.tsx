import { obtenerDocumentoVigente } from "@/actions/legal";
import { fechaLarga } from "@/lib/formato";
import { parsearMarkdown, type Bloque } from "@/lib/legal/markdown";
import type { TipoDocumento } from "@/lib/legal/requisitos";

function BloqueLegal({ bloque }: { bloque: Bloque }) {
    switch (bloque.tipo) {
        case "titulo":
            return <h2 className="pt-4 text-xl font-semibold leading-snug">{bloque.texto}</h2>;
        case "parrafo":
            return <p className="leading-relaxed">{bloque.texto}</p>;
        case "lista":
            return <ul className="list-disc space-y-1 pl-6">{bloque.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
        case "tabla":
            return <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[var(--color-surface)] text-left"><tr>{bloque.cabecera.map((celda, i) => <th key={i} className="px-3 py-2 font-medium">{celda}</th>)}</tr></thead><tbody>{bloque.filas.map((fila, i) => <tr key={i} className="border-t border-[var(--color-border)]">{fila.map((celda, j) => <td key={j} className="px-3 py-2 align-top">{celda}</td>)}</tr>)}</tbody></table></div>;
    }
}

export default async function DocumentoLegal({ tipo }: { tipo: TipoDocumento }) {
    const doc = await obtenerDocumentoVigente(tipo);

    if (!doc) return <main className=" bg-[var(--color-surface)] pb-16 text-[var(--color-ink)]">
        <header className="bg-[var(--color-navy)] py-14 text-white md:py-20"><div className="container"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-sage)]">Sagunto Padel Cup</p><h1 className="text-3xl font-bold md:text-5xl">Documento en preparación</h1></div></header>
        <div className="container max-w-3xl py-10"><p className="text-lg leading-relaxed text-[var(--color-muted)]">Este documento todavía no está publicado. Estamos preparando su contenido para que puedas consultarlo aquí.</p></div>
    </main>;

    return <main className="bg-[var(--color-surface)] pb-16 text-[var(--color-ink)]">
        <header className="bg-[var(--color-navy)] py-14 text-white md:py-20"><div className="container"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-sage)]">Información legal</p><h1 className="text-3xl font-bold md:text-5xl">{doc.titulo}</h1><p className="mt-3 text-sm text-white/75">Versión {doc.version} · Publicada el {fechaLarga(doc.publicadoAt)}</p></div></header>
        <article className="container max-w-3xl space-y-5 py-10 md:py-14">{parsearMarkdown(doc.contenido).map((bloque, i) => <BloqueLegal key={i} bloque={bloque} />)}</article>
    </main>;
}
