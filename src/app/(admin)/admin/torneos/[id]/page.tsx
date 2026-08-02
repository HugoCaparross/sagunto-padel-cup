// Ruta: src/app/(admin)/admin/torneos/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import TournamentDetailForm from "@/components/admin/TournamentDetailForm";
import { notFound } from "next/navigation";

export default async function AdminTorneoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: torneo } = await admin
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("id", id)
    .single();

  if (!torneo) notFound();

  const { data: categorias } = await admin
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  const { data: categoriasActivas } = await admin
    .from("tournament_categories")
    .select("categoria_id, cupo_minimo, cupo_maximo")
    .eq("tournament_id", id);

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">{torneo.nombre}</h1>
      <TournamentDetailForm
        torneoId={torneo.id}
        estadoActual={torneo.estado}
        categorias={categorias ?? []}
        categoriasActivas={categoriasActivas ?? []}
      />
    </main>
  );
}