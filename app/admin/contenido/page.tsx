import type { Metadata } from "next";
import Link from "next/link";
import { listarNoticiasAdmin } from "@/actions/noticias";
import PanelNoticias from "@/components/contenido/PanelNoticias";

export const metadata: Metadata = { title: "Noticias · Admin" };

export default async function PaginaContenido() {
  const res = await listarNoticiasAdmin();

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Noticias</h1>
          <p className="text-sm text-[#68737D]">Borradores y publicadas</p>
        </div>
        <Link
          href="/admin/contenido/nueva"
          className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white"
        >
          Nueva noticia
        </Link>
      </header>

      {res.ok ? (
        <PanelNoticias noticias={res.noticias} />
      ) : (
        <p className="rounded-lg bg-[#FDECEC] p-3 text-sm text-[#C73535]">{res.error}</p>
      )}
    </main>
  );
}