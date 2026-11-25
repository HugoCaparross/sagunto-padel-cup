import type { Metadata } from "next";
import Link from "next/link";
import { listarNoticias } from "@/actions/noticias";
import TarjetaNoticia from "@/components/noticias/TarjetaNoticia";
import {
  CATEGORIAS_NOTICIA,
  ETIQUETAS_NOTICIA,
  type CategoriaNoticia,
} from "@/lib/validadores/noticias";

export const metadata: Metadata = { title: "Noticias" };

type Props = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function PaginaNoticias({ searchParams }: Props) {
  const { categoria } = await searchParams;

  const activa = (CATEGORIAS_NOTICIA as readonly string[]).includes(categoria ?? "")
    ? (categoria as CategoriaNoticia)
    : undefined;

  const noticias = await listarNoticias({ categoria: activa, limite: 50 });

  return (
    <main className="container space-y-10 py-12">
      <header className="space-y-2">
        <h1 className="heading-font text-6xl">Noticias</h1>
        <p className="text-lg text-[var(--color-muted)]">Novedades del circuito, resultados y avisos.</p>
      </header>

      <nav aria-label="Categorías de noticias" className="flex flex-wrap gap-2">
        <Link
          href="/noticias"
          aria-current={activa === undefined ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-sm ${activa === undefined ? "bg-[var(--color-navy)] text-white" : "bg-white ring-1 ring-[var(--color-border)]"
            }`}
        >
          Todas
        </Link>
        {CATEGORIAS_NOTICIA.map((c) => (
          <Link
            key={c}
            href={`/noticias?categoria=${c}`}
            aria-current={activa === c ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm ${activa === c ? "bg-[var(--color-navy)] text-white" : "bg-white ring-1 ring-[var(--color-border)]"
              }`}
          >
            {ETIQUETAS_NOTICIA[c]}
          </Link>
        ))}
      </nav>

      {noticias.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
          Todavía no hay noticias en esta categoría.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {noticias.map((n) => (
            <li key={n.id}>
              <TarjetaNoticia noticia={n} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}