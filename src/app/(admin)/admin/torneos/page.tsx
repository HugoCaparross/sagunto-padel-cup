// Ruta: src/app/(admin)/admin/torneos/page.tsx — sustituye entero al archivo actual
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import TournamentForm from "@/components/admin/TournamentForm";

export default async function AdminTorneosPage() {
  const admin = createAdminClient();
  const { data: torneos } = await admin
    .from("tournaments")
    .select("id, nombre, slug, estado, fecha_inicio")
    .order("fecha_inicio", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Torneos</h1>

      <TournamentForm />

      <ul className="mt-10 space-y-3">
        {torneos?.map((t) => (
          <li key={t.id}>
            <Link
              href={`/admin/torneos/${t.id}`}
              className="rounded-card bg-navy-light px-5 py-4 flex justify-between hover:bg-navy-light/80"
            >
              <span>{t.nombre}</span>
              <span className="text-sage text-sm uppercase">{t.estado}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}