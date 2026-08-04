// Ruta: src/app/(admin)/admin/torneos/[id]/patrocinadores/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import PatrocinadoresManager from "@/components/admin/PatrocinadoresManager";
import { notFound } from "next/navigation";

export default async function AdminPatrocinadoresPage({
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

  const { data: sponsors } = await admin
    .from("sponsors")
    .select("id, nombre, descripcion, tipo")
    .eq("tournament_id", id)
    .order("orden");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Patrocinadores</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>
      <PatrocinadoresManager torneoId={id} sponsorsIniciales={sponsors ?? []} />
    </main>
  );
}