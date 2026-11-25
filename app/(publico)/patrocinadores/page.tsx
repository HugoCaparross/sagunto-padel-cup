import type { Metadata } from "next";
import Link from "next/link";
import LogoPatrocinador from "@/components/patrocinio/LogoPatrocinador";
import { patrocinadoresActivos } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Patrocinadores" };

export default async function PaginaPatrocinadores() {
  const patrocinadores = await patrocinadoresActivos();
  const institucionales = patrocinadores.filter((p) => p.tipo === "institucional");
  const comerciales = patrocinadores.filter((p) => p.tipo === "comercial");

  return (
    <main className="container space-y-12 py-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-coral-texto">Comunidad SPC</p>
        <h1 className="heading-font text-5xl sm:text-6xl">Patrocinadores</h1>
        <p className="text-lg text-muted">Las entidades que hacen posible el circuito y apoyan el pádel local.</p>
      </header>

      {patrocinadores.length === 0 ? (
        <p className="card p-6 text-sm text-muted">Todavía no hay patrocinadores activos.</p>
      ) : (
        <div className="space-y-10">
          {institucionales.length > 0 && (
            <section className="space-y-4" aria-labelledby="patrocinadores-institucionales">
              <h2 id="patrocinadores-institucionales" className="heading-font text-2xl">Apoyo institucional</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {institucionales.map((patrocinador) => (
                  <li key={patrocinador.id}><LogoPatrocinador patrocinador={patrocinador} grande /></li>
                ))}
              </ul>
            </section>
          )}
          {comerciales.length > 0 && (
            <section className="space-y-4" aria-labelledby="patrocinadores-comerciales">
              <h2 id="patrocinadores-comerciales" className="heading-font text-2xl">Empresas colaboradoras</h2>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {comerciales.map((patrocinador) => (
                  <li key={patrocinador.id}><LogoPatrocinador patrocinador={patrocinador} /></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="rounded-2xl bg-sage p-8 text-navy sm:p-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em]">Crezcamos juntos</p>
          <h2 className="heading-font text-3xl sm:text-4xl">¿Quieres patrocinar el circuito?</h2>
          <p>Conecta tu marca con el pádel local y acompaña a la comunidad de Sagunto durante toda la temporada.</p>
          <Link href="/contacto?tipo=patrocinio" className="btn btn-primario inline-flex">Contactar como patrocinador</Link>
        </div>
      </section>

      <footer>
        <Link href="/patrocinadores/historico" className="text-sm underline">Ver el histórico por prueba</Link>
      </footer>
    </main>
  );
}
