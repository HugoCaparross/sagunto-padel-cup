// Ruta: src/app/(admin)/admin/torneos/[id]/cuadros/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import CuadroButton from "@/components/admin/CuadroButton";
import { notFound } from "next/navigation";

type BracketRow = {
  id: string;
  tramo: string;
  categoria_id: string;
  estructura_json: { fase_inicial: string; byes: string[]; enfrentamientos: [string, string][] };
};

type PlayerName = { nombre: string; apellidos: string } | null;

export default async function CuadrosPage({
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

  const { data: brackets } = await admin
    .from("brackets")
    .select("id, tramo, categoria_id, estructura_json")
    .eq("tournament_id", id)
    .returns<BracketRow[]>();

  const { data: pairs } = await admin
    .from("pairs")
    .select(
      "id, player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)"
    )
    .returns<{ id: string; player1: PlayerName; player2: PlayerName }[]>();

  function nombrePareja(pairId: string) {
    const p = pairs?.find((x) => x.id === pairId);
    if (!p) return "?";
    const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
    const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
    return n1 + n2;
  }

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Cuadros</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>

      {categorias?.map((cat) => (
        <div key={cat.categoria_id} className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">
              {(cat.categories as unknown as { nombre: string })?.nombre}
            </h2>
            <CuadroButton torneoId={id} categoriaId={cat.categoria_id} />
          </div>

          {(["oro", "plata", "bronce"] as const).map((tramo) => {
            const b = brackets?.find(
              (br) => br.categoria_id === cat.categoria_id && br.tramo === tramo
            );
            if (!b) return null;

            return (
              <div key={tramo} className="mb-4 rounded-card bg-navy-light p-4">
                <p className="font-semibold capitalize mb-2">{tramo}</p>
                {b.estructura_json.byes.length > 0 && (
                  <p className="text-sm text-sage mb-2">
                    Bye directo: {b.estructura_json.byes.map(nombrePareja).join(", ")}
                  </p>
                )}
                <ul className="text-sm space-y-1">
                  {b.estructura_json.enfrentamientos.map(([p1, p2], i) => (
                    <li key={i}>
                      {nombrePareja(p1)} vs {nombrePareja(p2)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </main>
  );
}