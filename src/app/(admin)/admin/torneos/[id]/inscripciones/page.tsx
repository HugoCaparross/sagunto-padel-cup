// Ruta: src/app/(admin)/admin/torneos/[id]/inscripciones/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import InscripcionesTable from "@/components/admin/InscripcionesTable";
import { notFound } from "next/navigation";

type PairRow = {
  id: string;
  estado: string;
  categorias: { nombre: string } | null;
  player1: { nombre: string; apellidos: string } | null;
  player2: { nombre: string; apellidos: string } | null;
  registrations: { id: string; checked_in: boolean }[];
};

export default async function AdminInscripcionesPage({
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

  const { data: parejas } = await admin
    .from("pairs")
    .select(
      "id, estado, categorias:categories(nombre), player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos), registrations(id, checked_in)"
    )
    .eq("tournament_id", id)
    .returns<PairRow[]>();

  const filas = (parejas ?? []).map((p) => ({
    pairId: p.id,
    registrationId: p.registrations[0]?.id ?? "",
    categoria: p.categorias?.nombre ?? "",
    jugadores: [
      p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?",
      p.player2 ? `${p.player2.nombre} ${p.player2.apellidos}` : "Sin pareja",
    ].join(" / "),
    estado: p.estado,
    checkedIn: p.registrations[0]?.checked_in ?? false,
  }));

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Inscripciones</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>
      <InscripcionesTable torneoId={id} filas={filas} />
    </main>
  );
}