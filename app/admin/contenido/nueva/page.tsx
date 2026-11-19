import type { Metadata } from "next";
import Link from "next/link";
import FormularioNoticia from "@/components/contenido/FormularioNoticia";

export const metadata: Metadata = { title: "Nueva noticia · Admin" };

export default function PaginaNuevaNoticia() {
    return (
        <main className="max-w-3xl space-y-6">
            <nav className="text-sm text-[#68737D]">
                <Link href="/admin/contenido" className="hover:underline">
                    Noticias
                </Link>
                <span> / Nueva</span>
            </nav>
            <h1 className="text-2xl font-semibold">Nueva noticia</h1>
            <FormularioNoticia />
        </main>
    );
}