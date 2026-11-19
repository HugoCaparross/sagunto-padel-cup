import type { Metadata } from "next";
import Link from "next/link";
import LogoPatrocinador from "@/components/patrocinio/LogoPatrocinador";
import { fechaLarga } from "@/lib/formato";
import { historicoPatrocinadores } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Histórico de patrocinadores" };

export default async function PaginaHistorico() {
  const historico = await historicoPatrocinadores();

  return (
    <main className="container space-y-12 py-12">
      <header className="space-y-2">
        <Link href="/patrocinadores" className="text-sm text-[#68737D] hover:underline">
          ← Patrocinadores
        </Link>
        <h1 className="heading-font text-5xl">Histórico</h1>
        <p className="text-lg text-[#68737D]">Patrocinadores de cada prueba del circuito.</p>
      </header>

      {historico.length === 0 ? (
        <p className="text-sm text-[#68737D]">Todavía no hay histórico.</p>
      ) : (
        historico.map(({ prueba, patrocinadores }) => (
          <section key={prueba.id} className="space-y-4">
            <div>
              <h2 className="font-semibold">{prueba.nombre}</h2>
              <p className="text-xs text-[#68737D]">{fechaLarga(prueba.fechaInicio)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {patrocinadores.map((p) => (
                <LogoPatrocinador key={p.id} patrocinador={p} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}