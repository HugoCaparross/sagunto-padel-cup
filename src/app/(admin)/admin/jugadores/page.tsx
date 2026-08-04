// Ruta: src/app/(admin)/admin/jugadores/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import JugadoresTable from "@/components/admin/JugadoresTable";

export default async function AdminJugadoresPage() {
  const admin = createAdminClient();

  const { data: jugadores } = await admin
    .from("players")
    .select("id, nombre, apellidos, categoria_actual_id, estado")
    .order("nombre");

  const { data: categorias } = await admin
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Jugadores</h1>
      <JugadoresTable jugadoresIniciales={jugadores ?? []} categorias={categorias ?? []} />
    </main>
  );
}