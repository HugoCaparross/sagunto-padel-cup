import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarNoticiasAdmin } from "@/actions/noticias";
import FormularioNoticia from "@/components/contenido/FormularioNoticia";

export const metadata: Metadata = { title: "Editar noticia · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function PaginaEditarNoticia({ params }: Props) {
    const { id } = await params;

    const res = await listarNoticiasAdmin();
    if (!res.ok) return <p className="text-[var(--color-danger)]">{res.error}</p>;

    const noticia = res.noticias.find((n) => n.id === id);
    if (!noticia) notFound();

    return (
        <main className="max-w-3xl space-y-6">
            <nav className="text-sm text-[var(--color-muted)]">
                <Link href="/admin/contenido" className="hover:underline">
                    Noticias
                </Link>
                <span> / Editar</span>
            </nav>
            <h1 className="text-2xl font-semibold">Editar noticia</h1>
            <FormularioNoticia inicial={noticia} />
        </main>
    );
}