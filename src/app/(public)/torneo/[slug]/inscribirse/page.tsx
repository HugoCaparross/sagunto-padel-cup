// Ruta: src/app/(public)/torneo/[slug]/inscribirse/page.tsx
import { createClient } from "@/lib/supabase/server";
import RegistrationForm from "@/components/RegistrationForm";
import { notFound } from "next/navigation";

export default async function InscribirsePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Inscripción</h1>
      <p className="text-navy/70 mb-8">{tournament.nombre}</p>

      {tournament.estado !== "inscripciones_abiertas" ? (
        <p className="rounded-card bg-navy/5 p-6">
          Las inscripciones para este torneo no están abiertas ahora mismo.
        </p>
      ) : (
        <RegistrationForm torneoSlug={slug} categorias={categorias ?? []} />
      )}
    </main>
  );
}