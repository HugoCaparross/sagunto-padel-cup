import type { Metadata } from "next";
import TarjetaPrueba from "@/components/pruebas/TarjetaPrueba";
import { listarPruebasPublicas } from "@/lib/pruebas/publico";

export const metadata: Metadata = { title: "Calendario" };

export default async function PaginaCalendario() {
  const pruebas = await listarPruebasPublicas();

  const proximas = pruebas.filter((p) => p.estado !== "finalizada");
  const finalizadas = pruebas.filter((p) => p.estado === "finalizada").reverse();

  return (
    <main className="container space-y-12 py-12">
      <header className="space-y-2">
        <h1 className="heading-font text-5xl">Calendario</h1>
        <p className="text-sm text-[#68737D]">
          Fechas de las pruebas del circuito y del Máster Final.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-semibold">Próximas</h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-[#68737D]">No hay pruebas programadas por el momento.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {proximas.map((p) => (
              <TarjetaPrueba key={p.id} prueba={p} />
            ))}
          </div>
        )}
      </section>

      {finalizadas.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold">Finalizadas</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {finalizadas.map((p) => (
              <TarjetaPrueba key={p.id} prueba={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}