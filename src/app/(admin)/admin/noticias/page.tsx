// Ruta: src/app/(admin)/admin/noticias/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import NoticiasManager from "@/components/admin/NoticiasManager";

export default async function AdminNoticiasPage() {
  const admin = createAdminClient();
  const { data: noticias } = await admin
    .from("news")
    .select("id, titulo, estado")
    .order("fecha_publicacion", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Noticias</h1>
      <NoticiasManager noticiasIniciales={noticias ?? []} />
    </main>
  );
}