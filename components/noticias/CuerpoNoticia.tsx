import { parsearMarkdown, type Bloque } from "@/lib/legal/markdown";

function Bloque({ bloque }: { bloque: Bloque }) {
    switch (bloque.tipo) {
        case "titulo":
            return <h2 className="heading-font pt-6 text-3xl">{bloque.texto}</h2>;

        case "parrafo":
            return <p className="leading-relaxed text-[#18232D]">{bloque.texto}</p>;

        case "lista":
            return (
                <ul className="list-disc space-y-1 pl-6 text-[#18232D]">
                    {bloque.items.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            );

        case "tabla":
            return (
                <div className="overflow-x-auto rounded-lg ring-1 ring-[#D5D9DC]">
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

export default function CuerpoNoticia({ texto }: { texto: string }) {
    return (
        <div className="space-y-4">
            {parsearMarkdown(texto).map((bloque, i) => (
                <Bloque key={i} bloque={bloque} />
            ))}
        </div>
    );
}