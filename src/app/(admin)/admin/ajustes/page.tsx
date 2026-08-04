// Ruta: src/app/(admin)/admin/ajustes/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import ClubForm from "@/components/admin/ClubForm";

export default async function AjustesPage() {
  const admin = createAdminClient();
  const { data: clubs } = await admin.from("clubs").select("id, nombre, direccion").order("nombre");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Ajustes — Clubes</h1>

      <ClubForm />

      <ul className="mt-8 space-y-2">
        {clubs?.map((c) => (
          <li key={c.id} className="rounded-card bg-navy-light px-4 py-3 text-sm">
            {c.nombre} {c.direccion && `— ${c.direccion}`}
          </li>
        ))}
      </ul>
    </main>
  );
}