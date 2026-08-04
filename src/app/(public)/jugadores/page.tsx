// Ruta: src/app/(public)/jugadores/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Jugadores" };

export default async function JugadoresPage() {
  const supabase = await createClient();

  const { data: jugadores } = await supabase
    .from("players")
    .select("id, nombre, apellidos, categories(nombre)")
    .eq("estado", "activo")
    .order("nombre");

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Jugadores</h1>

      <ul className="space-y-2">
        {jugadores?.map((j) => (
          <li key={j.id}>
            <Link
              href={`/jugador/${j.id}`}
              className="flex justify-between items-center rounded-card bg-navy/5 hover:bg-navy/10 px-5 py-3"
            >
              <span>
                {j.nombre} {j.apellidos}
              </span>
              <span className="text-sm text-navy/60">
                {(j.categories as unknown as { nombre: string })?.nombre}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!jugadores?.length && (
        <p className="text-navy/70">Aún no hay jugadores registrados.</p>
      )}
    </main>
  );
}