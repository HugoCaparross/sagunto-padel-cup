// Ruta: src/app/(public)/calendario/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Fecha por confirmar",
  publicado: "Próximamente",
  inscripciones_abiertas: "Inscripciones abiertas",
  en_juego: "En juego",
  finalizado: "Finalizado",
  archivado: "Finalizado",
};

export const metadata = { title: "Calendario" };

export default async function CalendarioPage() {
  const supabase = await createClient();

  const { data: torneos } = await supabase
    .from("tournaments")
    .select("nombre, slug, estado, fecha_inicio")
    .neq("estado", "borrador")
    .order("fecha_inicio");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Calendario</h1>

      {!torneos?.length && (
        <p className="text-navy/70">
          Todavía no hay torneos publicados. ¡Vuelve pronto!
        </p>
      )}

      <ul className="space-y-3">
        {torneos?.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/torneo/${t.slug}`}
              className="flex justify-between items-center rounded-card bg-navy/5 hover:bg-navy/10 px-5 py-4"
            >
              <div>
                <p className="font-semibold">{t.nombre}</p>
                <p className="text-sm text-navy/70">
                  {new Date(t.fecha_inicio).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-sm bg-sage/30 px-3 py-1 rounded-card">
                {ESTADO_LABEL[t.estado] ?? t.estado}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}