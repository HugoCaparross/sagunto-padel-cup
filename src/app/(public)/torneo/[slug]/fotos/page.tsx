// Ruta: src/app/(public)/torneo/[slug]/fotos/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function FotosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .single();

  if (!torneo) notFound();

  const { data: fotos } = await supabase
    .from("gallery_items")
    .select("id, url")
    .eq("tournament_id", torneo.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Fotos</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fotos?.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f.id}
            src={f.url}
            alt=""
            className="rounded-card aspect-square object-cover w-full"
          />
        ))}
      </div>

      {!fotos?.length && <p className="text-navy/70">Aún no hay fotos subidas.</p>}
    </main>
  );
}