// Ruta: src/app/(public)/noticias/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: noticia } = await supabase
    .from("news")
    .select("titulo, contenido, imagen_destacada, categoria, fecha_publicacion")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();

  if (!noticia) notFound();

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
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