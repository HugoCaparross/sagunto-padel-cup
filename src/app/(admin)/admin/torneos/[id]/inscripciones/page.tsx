// Ruta: src/app/(admin)/admin/torneos/[id]/inscripciones/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import InscripcionesTable from "@/components/admin/InscripcionesTable";
import { notFound } from "next/navigation";

type PairRow = {
  id: string;
  estado: string;
  categorias: {
    nombre: string;
  } | null;
  player1: {
    nombre: string;
    apellidos: string;
  } | null;
  player2: {
    nombre: string;
    apellidos: string;
  } | null;
  registrations: {
    id: string;
    checked_in: boolean;
  }[];
};

export const dynamic = "force-dynamic";

export default async function AdminInscripcionesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: parejas, error: parejasError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin
      .from("pairs")
      .select(
        "id, estado, categorias:categories(nombre), player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos), registrations(id, checked_in)",
      )
      .eq("tournament_id", id)
      .order("estado")
      .returns<PairRow[]>(),
  ]);

  if (torneoError) {
    console.error("[admin/inscripciones] Error cargando torneo:", torneoError);
  }

  if (parejasError) {
    console.error(
      "[admin/inscripciones] Error cargando inscripciones:",
      parejasError,
    );
  }

  if (!torneo) {
    notFound();
  }

  const filas = (parejas ?? []).map((pareja) => ({
    pairId: pareja.id,
    registrationId: pareja.registrations[0]?.id ?? "",
    categoria: pareja.categorias?.nombre ?? "Categoría pendiente",
    jugadores: [
      pareja.player1
        ? `${pareja.player1.nombre} ${pareja.player1.apellidos}`
        : "Jugador pendiente",
      pareja.player2
        ? `${pareja.player2.nombre} ${pareja.player2.apellidos}`
        : "Sin pareja",
    ].join(" / "),
    estado: pareja.estado,
    checkedIn: pareja.registrations[0]?.checked_in ?? false,
  }));

  const confirmadas = filas.filter(
    (fila) => fila.estado === "confirmada",
  ).length;

  const listaEspera = filas.filter(
    (fila) => fila.estado === "lista_espera",
  ).length;

  const pendientes = filas.filter(
    (fila) => fila.estado === "incompleta" || fila.estado === "pendiente_pago",
  ).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Competición
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Inscripciones
        </h1>

        <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
      </header>

      {parejasError ? (
        <section
          role="alert"
          className="mb-6 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar las inscripciones
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Inténtalo de nuevo antes de realizar cambios sobre la competición.
          </p>
        </section>
      ) : null}

      <section
        aria-label="Resumen de inscripciones"
        className="mb-8 grid grid-cols-2 border-y border-offwhite/10 md:grid-cols-4"
      >
        <div className="border-r border-offwhite/10 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Total
          </p>

          <p className="mt-1 font-display text-2xl">{filas.length}</p>
        </div>

        <div className="border-b border-offwhite/10 px-4 py-4 md:border-b-0 md:border-r">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Confirmadas
          </p>

          <p className="mt-1 font-display text-2xl">{confirmadas}</p>
        </div>

        <div className="border-r border-offwhite/10 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Lista de espera
          </p>

          <p className="mt-1 font-display text-2xl">{listaEspera}</p>
        </div>

        <div className="px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-offwhite/40">
            Pendientes
          </p>

          <p className="mt-1 font-display text-2xl">{pendientes}</p>
        </div>
      </section>

      <section aria-label="Listado de inscripciones">
        <div className="mb-4">
          <h2 className="font-display text-xl">Participantes</h2>

          <p className="mt-1 text-sm text-offwhite/50">
            Gestiona estado y check-in desde el listado.
          </p>
        </div>

        <InscripcionesTable torneoId={id} filas={filas} />
      </section>
    </main>
  );
}
