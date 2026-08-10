// Ruta: src/app/(public)/noticias/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type NewsPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: noticia } = await supabase
    .from("news")
    .select("titulo, contenido, imagen_destacada, fecha_publicacion")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();

  if (!noticia) return { robots: { index: false, follow: false } };

  const description = noticia.contenido.slice(0, 160);
  const url = `/noticias/${slug}`;
  return {
    title: noticia.titulo,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: noticia.titulo,
      description,
      url,
      publishedTime: noticia.fecha_publicacion,
      images: noticia.imagen_destacada ? [{ url: noticia.imagen_destacada }] : undefined,
    },
  };
}

export default async function NoticiaPage({
  params,
}: NewsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: noticia } = await supabase
    .from("news")
    .select("titulo, contenido, imagen_destacada, categoria, fecha_publicacion")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();

  if (!noticia) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.titulo,
    datePublished: noticia.fecha_publicacion,
    mainEntityOfPage: `${siteUrl}/noticias/${slug}`,
    author: { "@type": "Organization", name: "Sagunto Padel Cup" },
    publisher: { "@type": "Organization", name: "Sagunto Padel Cup" },
    ...(noticia.imagen_destacada ? { image: noticia.imagen_destacada } : {}),
  };

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <p className="text-xs text-sage uppercase mb-2">{noticia.categoria}</p>
      <h1 className="font-display text-3xl mb-2">{noticia.titulo}</h1>
      <p className="text-xs text-navy/50 mb-8">
        {new Date(noticia.fecha_publicacion).toLocaleDateString("es-ES")}
      </p>

      {noticia.imagen_destacada && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={noticia.imagen_destacada} alt="" className="rounded-card mb-6 w-full" />
      )}

      <div className="prose whitespace-pre-line">{noticia.contenido}</div>
    </main>
  );
}
