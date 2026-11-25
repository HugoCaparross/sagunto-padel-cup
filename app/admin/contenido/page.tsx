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
          <p className="text-sm text-[var(--color-muted)]">Borradores y publicadas</p>
        </div>
        <Link
          href="/admin/contenido/nueva"
          className="btn btn-primario btn-md"
        >
          Nueva noticia
        </Link>
      </header>

      {res.ok ? (
        <PanelNoticias noticias={res.noticias} />
      ) : (
        <p className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">{res.error}</p>
      )}
    </main>
  );
}
