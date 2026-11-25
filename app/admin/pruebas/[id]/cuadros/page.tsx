import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import { obtenerEditorLlaves } from "@/actions/cuadros";
import EditorGrupos from "@/components/cuadros/EditorGrupos";
import EditorLlaves from "@/components/cuadros/EditorLlaves";
import CierreCategoria from "@/components/cuadros/CierreCategoria";

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ categoria?: string }>;
};

export default async function PaginaCuadros({ params, searchParams }: Props) {
    const { id } = await params;
    const { categoria } = await searchParams;

    const cat: Categoria = (CATEGORIAS as readonly string[]).includes(categoria ?? "")
        ? (categoria as Categoria)
        : "segunda";

    const res = await obtenerEditorLlaves({ pruebaId: id, categoria: cat });

    return (
        <main className="space-y-10 p-6">
            <nav className="flex gap-2">
                {CATEGORIAS.map((c) => (
                    <Link
                        key={c}
                        href={`?categoria=${c}`}
                        className={`rounded-md px-3 py-1 text-sm ${c === cat ? "bg-[var(--color-navy)] text-white" : "bg-white ring-1 ring-[var(--color-border)]"
                            }`}
                    >
                        {c}
                    </Link>
                ))}
            </nav>

            {res.ok ? (
                <>
                    <EditorGrupos pruebaId={id} categoria={cat} datos={res.datos} />
                    <EditorLlaves pruebaId={id} categoria={cat} datos={res.datos} />
                    <CierreCategoria pruebaId={id} categoria={cat} />
                </>
            ) : (
                <p className="text-[var(--color-danger)]">{res.error}</p>
            )}
        </main>
    );
}