// Ruta: src/app/(public)/torneo/[slug]/participantes/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const ESTADO_LABEL: Record<string, string> = {
  confirmada: "Confirmada",
  lista_espera: "Lista de espera",
  incompleta: "Falta compañero/a",
  pendiente_pago: "Pendiente de pago",
};

type PairRow = {
  id: string;
  categoria_id: string;
  estado: string;
  player1: {
    nombre: string;
    apellidos: string;
  } | null;
  player2: {
    nombre: string;
    apellidos: string;
  } | null;
};

export default async function ParticipantesPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  const { data: parejas } = await supabase
    .from("pairs")
    .select(
      "id, categoria_id, estado, player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)",
    )
    .eq("tournament_id", torneo.id)
    .returns<PairRow[]>();

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Participantes</h1>

      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      {categorias?.map((categoria) => {
        const deLaCategoria =
          parejas?.filter((pareja) => pareja.categoria_id === categoria.id) ??
          [];

        if (!deLaCategoria.length) {
          return null;
        }

        return (
          <div key={categoria.id} className="mb-8">
            <h2 className="font-display text-xl mb-3">{categoria.nombre}</h2>

            <ul className="space-y-2">
              {deLaCategoria.map((pareja) => (
                <li
                  key={pareja.id}
                  className="flex justify-between items-center rounded-card bg-navy/5 px-4 py-3"
                >
                  <span>
                    {pareja.player1?.nombre} {pareja.player1?.apellidos}
                    {pareja.player2 &&
                      ` / ${pareja.player2.nombre} ${pareja.player2.apellidos}`}
                  </span>

                  <span className="text-sm text-navy/60">
                    {ESTADO_LABEL[pareja.estado] ?? pareja.estado}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {!parejas?.length && (
        <p className="text-navy/70">Aún no hay inscripciones.</p>
      )}
    </main>
  );
}
