// Ruta: src/app/(admin)/admin/torneos/[id]/galeria/page.tsx — sustituye entero al archivo actual
import { createAdminClient } from "@/lib/supabase/admin";
import GaleriaManager from "@/components/admin/GaleriaManager";
import AccesoColaboradorForm from "@/components/admin/AccesoColaboradorForm";
import { notFound } from "next/navigation";

export default async function AdminGaleriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: torneo } = await admin.from("tournaments").select("nombre").eq("id", id).single();
  if (!torneo) notFound();

  const { data: fotos } = await admin
    .from("gallery_items")
    .select("id, url")
    .eq("tournament_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-5 py-12 space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-2">Galería</h1>
        <p className="text-offwhite/60">{torneo.nombre}</p>
      </div>

      <AccesoColaboradorForm torneoId={id} />

      <GaleriaManager torneoId={id} fotosIniciales={fotos ?? []} />
    </main>
  );
}