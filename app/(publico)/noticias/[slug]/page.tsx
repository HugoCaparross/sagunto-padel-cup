import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerNoticia } from "@/actions/noticias";
import CuerpoNoticia from "@/components/noticias/CuerpoNoticia";
import { fechaLarga } from "@/lib/formato";
import { ETIQUETAS_NOTICIA } from "@/lib/validadores/noticias";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = await obtenerNoticia(slug);
  if (!noticia) return { title: "Noticia no encontrada" };
  return {
    title: noticia.titulo,
    description: noticia.resumen,
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumen,
      images: noticia.imagenUrl ? [noticia.imagenUrl] : undefined,
    },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;

  const noticia = await obtenerNoticia(slug);
  if (!noticia) notFound();

  return (
    <main className="container py-12">
      <article className="mx-auto max-w-[720px] space-y-8">
        <nav className="text-sm text-[#68737D]">
          <Link href="/noticias" className="hover:underline">
            Noticias
          </Link>
          <span> / {ETIQUETAS_NOTICIA[noticia.categoria]}</span>
        </nav>

        <header className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-[#68737D]">
            {ETIQUETAS_NOTICIA[noticia.categoria]}
            {noticia.publicadaAt && ` · ${fechaLarga(noticia.publicadaAt)}`}
          </p>
          <h1 className="heading-font text-5xl leading-tight">{noticia.titulo}</h1>
          <p className="text-lg text-[#68737D]">{noticia.resumen}</p>
        </header>

        {noticia.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={noticia.imagenUrl}
            alt=""
            className="w-full rounded-xl object-cover"
          />
        )}

        <CuerpoNoticia texto={noticia.contenido} />

        <footer className="border-t border-[#D5D9DC] pt-6">
          <Link href="/noticias" className="text-sm underline">
            Volver a las noticias
          </Link>
        </footer>
      </article>
    </main>
  );
}