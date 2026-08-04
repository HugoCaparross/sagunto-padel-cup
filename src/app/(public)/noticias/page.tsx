// Ruta: src/app/(public)/noticias/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Noticias" };

export default async function NoticiasPage() {
  const supabase = await createClient();

  const { data: noticias } = await supabase
    .from("news")
    .select("slug, titulo, imagen_destacada, categoria, fecha_publicacion")
    .eq("estado", "publicado")
    .order("fecha_publicacion", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Noticias</h1>

      <ul className="space-y-4">
        {noticias?.map((n) => (
          <li key={n.slug}>
            <Link href={`/noticias/${n.slug}`} className="block rounded-card bg-navy/5 hover:bg-navy/10 px-5 py-4">
              <p className="text-xs text-sage uppercase mb-1">{n.categoria}</p>
              <p className="font-display text-lg">{n.titulo}</p>
              <p className="text-xs text-navy/50 mt-1">
                {new Date(n.fecha_publicacion).toLocaleDateString("es-ES")}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {!noticias?.length && <p className="text-navy/70">Aún no hay noticias.</p>}
    </main>
  );
}