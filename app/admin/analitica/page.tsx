import type { Metadata } from "next";
import Graficas from "@/components/analitica/Graficas";
import { cargarAnalitica } from "@/lib/analitica/datos";

export const metadata: Metadata = { title: "Analítica · Admin" };

export default async function PaginaAnalitica() {
  const datos = await cargarAnalitica();
  const k = datos.kpis;

  const tarjetas = [
    { etiqueta: "Jugadores registrados", valor: k.jugadoresRegistrados },
    { etiqueta: "Jugadores con inscripción activa", valor: k.jugadoresActivos },
    { etiqueta: "Parejas activas (total)", valor: k.inscripcionesActivas },
    {
      etiqueta: "Retención media entre pruebas",
      valor: k.retencionMedia === null ? "—" : `${k.retencionMedia}%`,
    },
  ];

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Analítica</h1>
        <p className="text-sm text-muted">Inscripciones, participación y retención del circuito.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.etiqueta} className="card p-4">
            <p className="text-sm text-muted">{t.etiqueta}</p>
            <p className="mt-1 text-2xl font-semibold">{t.valor}</p>
          </div>
        ))}
      </section>

      <Graficas
        semanal={datos.semanal}
        participacion={datos.participacion}
        retencion={datos.retencion}
        categorias={datos.categorias}
      />
    </main>
  );
}