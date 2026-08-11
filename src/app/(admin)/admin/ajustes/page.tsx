// Ruta: src/app/(admin)/admin/ajustes/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import ClubForm from "@/components/admin/ClubForm";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const admin = createAdminClient();

  const { data: clubs, error } = await admin
    .from("clubs")
    .select("id, nombre, direccion")
    .order("nombre");

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Ajustes
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-offwhite/65">
          Configuración operacional básica del circuito y gestión de las
          instalaciones utilizadas en las pruebas.
        </p>
      </header>

      <section aria-labelledby="clubes-title" className="space-y-6">
        <div>
          <h2 id="clubes-title" className="font-display text-xl">
            Clubes
          </h2>

          <p className="mt-1 text-sm text-offwhite/60">
            Gestiona las sedes que pueden asociarse a los torneos.
          </p>
        </div>

        <ClubForm />

        <div className="border-t border-offwhite/10 pt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Clubes registrados</h3>

              <p className="mt-1 text-xs text-offwhite/50">
                {clubs?.length ?? 0}{" "}
                {(clubs?.length ?? 0) === 1 ? "club" : "clubes"}
              </p>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="border border-coral/30 bg-coral/10 px-4 py-4 text-sm text-offwhite"
            >
              <p className="font-semibold">
                No se han podido cargar los clubes.
              </p>

              <p className="mt-1 text-offwhite/65">
                Inténtalo de nuevo. Si el problema continúa, revisa la
                configuración del sistema.
              </p>
            </div>
          ) : clubs && clubs.length > 0 ? (
            <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
              {clubs.map((club) => (
                <li
                  key={club.id}
                  className="flex min-h-16 items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {club.nombre}
                    </p>

                    {club.direccion ? (
                      <p className="mt-1 truncate text-xs text-offwhite/50">
                        {club.direccion}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-offwhite/40">
                        Sin dirección registrada
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-dashed border-offwhite/15 px-5 py-8">
              <p className="text-sm font-medium">
                Todavía no hay clubes registrados.
              </p>

              <p className="mt-1 text-sm text-offwhite/55">
                Crea el primero desde el formulario anterior.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
