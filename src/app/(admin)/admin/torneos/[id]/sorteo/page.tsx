// Ruta: src/app/(admin)/admin/torneos/[id]/sorteo/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import SorteoButton from "@/components/admin/SorteoButton";
import { notFound } from "next/navigation";

type StandingRow = {
  group_id: string;
  pair: {
    player1: { nombre: string; apellidos: string } | null;
    player2: { nombre: string; apellidos: string } | null;
  } | null;
};

export default async function SorteoPage({
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

  const { data: categorias } = await admin
    .from("tournament_categories")
    .select("categoria_id, categories(nombre)")
    .eq("tournament_id", id);

  const { data: grupos } = await admin
    .from("groups")
    .select("id, nombre, categoria_id")
    .eq("tournament_id", id);

  const { data: standings } = await admin
    .from("group_standings")
    .select(
      "group_id, pair:pairs(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .returns<StandingRow[]>();

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Sorteo</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>

      {categorias?.map((cat) => {
        const gruposCategoria = grupos?.filter(
          (g) => g.categoria_id === cat.categoria_id
        );

        return (
          <div key={cat.categoria_id} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">
                {(cat.categories as unknown as { nombre: string })?.nombre}
              </h2>
              <SorteoButton torneoId={id} categoriaId={cat.categoria_id} />
            </div>

            {!gruposCategoria?.length && (
              <p className="text-offwhite/60 text-sm">
                Aún no se ha generado el sorteo de esta categoría.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {gruposCategoria?.map((g) => (
                <div key={g.id} className="rounded-card bg-navy-light p-4">
                  <p className="font-semibold mb-2">{g.nombre}</p>
                  <ul className="text-sm space-y-1">
                    {standings
                      ?.filter((s) => s.group_id === g.id)
                      .map((s, i) => (
                        <li key={i}>
                          {s.pair?.player1?.nombre} {s.pair?.player1?.apellidos}
                          {s.pair?.player2 &&
                            ` / ${s.pair.player2.nombre} ${s.pair.player2.apellidos}`}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}