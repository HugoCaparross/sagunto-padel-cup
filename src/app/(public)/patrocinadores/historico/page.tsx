// Ruta: src/app/(public)/patrocinadores/historico/page.tsx
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Histórico de patrocinadores" };

type SponsorRow = {
  id: string;
  nombre: string;
  tipo: string;
  tournaments: { nombre: string } | null;
};

export default async function HistoricoPatrocinadoresPage() {
  const supabase = await createClient();

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("id, nombre, tipo, tournaments(nombre)")
    .order("tournament_id")
    .returns<SponsorRow[]>();

  const porTorneo = new Map<string, SponsorRow[]>();
  sponsors?.forEach((s) => {
    const key = s.tournaments?.nombre ?? "Sin torneo";
    if (!porTorneo.has(key)) porTorneo.set(key, []);
    porTorneo.get(key)!.push(s);
  });

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Histórico de patrocinadores</h1>

      {Array.from(porTorneo.entries()).map(([torneo, lista]) => (
        <div key={torneo} className="mb-8">
          <h2 className="font-display text-lg mb-2">{torneo}</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {lista.map((s) => (
              <li key={s.id} className="rounded-card bg-navy/5 px-4 py-2">
                {s.nombre}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {!sponsors?.length && (
        <p className="text-navy/70">Aún no hay histórico que mostrar.</p>
      )}
    </main>
  );
}