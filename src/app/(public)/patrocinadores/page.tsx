// Ruta: src/app/(public)/patrocinadores/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Patrocinadores" };

export default async function PatrocinadoresPage() {
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .neq("estado", "borrador")
    .neq("estado", "archivado")
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sponsors } = torneo
    ? await supabase
        .from("sponsors")
        .select("id, nombre, descripcion, enlace, tipo, logo_url")
        .eq("tournament_id", torneo.id)
        .order("orden")
    : { data: [] };

  const comerciales = sponsors?.filter((s) => s.tipo === "comercial") ?? [];
  const instituciones = sponsors?.filter((s) => s.tipo === "institucion") ?? [];

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Patrocinadores</h1>
      {torneo && <p className="text-navy/70 mb-8">{torneo.nombre}</p>}

      {instituciones.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3">Instituciones</h2>
          <ul className="space-y-3">
            {instituciones.map((s) => (
              <li key={s.id} className="rounded-card bg-sage/20 border border-sage px-5 py-4">
                <p className="font-semibold">{s.nombre}</p>
                {s.descripcion && <p className="text-sm text-navy/70 mt-1">{s.descripcion}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl mb-3">Patrocinadores</h2>
        <ul className="space-y-3">
          {comerciales.map((s) => (
            <li key={s.id} className="rounded-card bg-navy/5 px-5 py-4">
              <p className="font-semibold">{s.nombre}</p>
              {s.descripcion && <p className="text-sm text-navy/70 mt-1">{s.descripcion}</p>}
              {s.enlace && (
                <a href={s.enlace} className="text-sm text-coral underline" target="_blank">
                  Visitar web
                </a>
              )}
            </li>
          ))}
        </ul>
        {!comerciales.length && !instituciones.length && (
          <p className="text-navy/70">Próximamente anunciaremos los patrocinadores.</p>
        )}
      </section>

      <Link href="/patrocinadores/historico" className="inline-block mt-10 text-sm underline text-navy/60">
        Ver histórico de patrocinadores
      </Link>
    </main>
  );
}