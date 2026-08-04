// Ruta: src/app/(admin)/admin/torneos/[id]/premios/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import PremiosManager from "@/components/admin/PremiosManager";
import { notFound } from "next/navigation";

export default async function AdminPremiosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: torneo } = await admin
    .from("tournaments")
    .select("nombre")
    .eq("id", id)
    .single();

  if (!torneo) notFound();

  const { data: categorias } = await admin.from("categories").select("id, nombre").order("nivel_orden");
  const { data: sponsors } = await admin.from("sponsors").select("id, nombre").eq("tournament_id", id);
  const { data: premios } = await admin.from("premios").select("*").eq("tournament_id", id);

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Premios</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>

      <PremiosManager
        torneoId={id}
        categorias={categorias ?? []}
        sponsors={sponsors ?? []}
        premiosIniciales={premios ?? []}
      />
    </main>
  );
}