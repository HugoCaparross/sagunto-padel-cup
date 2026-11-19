import type { Metadata } from "next";
import Link from "next/link";
import LogoPatrocinador from "@/components/patrocinio/LogoPatrocinador";
import SelectorPrueba from "@/components/patrocinio/SelectorPrueba";
import {
  elegirPrueba,
  listarPruebasSelector,
  patrocinadoresDePrueba,
} from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Patrocinadores" };

type Props = {
  searchParams: Promise<{ prueba?: string }>;
};

export default async function PaginaPatrocinadores({ searchParams }: Props) {
  const { prueba: slug } = await searchParams;

  const pruebas = await listarPruebasSelector();
  const elegida = elegirPrueba(pruebas, slug);

  if (!elegida) {
    return (
      <main className="container py-12">
        <p className="text-sm text-[#68737D]">Todavía no hay pruebas en el circuito.</p>
      </main>
    );
  }

  const patrocinadores = await patrocinadoresDePrueba(elegida.id);
  const institucionales = patrocinadores.filter((p) => p.tipo === "institucional");
  const comerciales = patrocinadores.filter((p) => p.tipo === "comercial");

  return (
    <main className="container space-y-12 py-12">
      <header className="space-y-4">
        <h1 className="heading-font text-6xl">Patrocinadores</h1>
        <p className="text-lg text-[#68737D]">
          Las entidades que hacen posible el circuito.
        </p>
        <SelectorPrueba pruebas={pruebas} activaId={elegida.id} ruta="/patrocinadores" />
      </header>

      {patrocinadores.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
          Esta prueba todavía no tiene patrocinadores.
        </p>
      ) : (
        <>
          {institucionales.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-semibold">Institucionales</h2>
              <div className="grid gap-4 rounded-2xl border-2 border-[#F0443A] p-4 sm:grid-cols-2 lg:grid-cols-3">
                {institucionales.map((p) => (
                  <LogoPatrocinador key={p.id} patrocinador={p} grande />
                ))}
              </div>
            </section>
          )}

          {comerciales.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-semibold">Colaboradores</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {comerciales.map((p) => (
                  <LogoPatrocinador key={p.id} patrocinador={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer>
        <Link href="/patrocinadores/historico" className="text-sm underline">
          Ver patrocinadores de temporadas anteriores
        </Link>
      </footer>
    </main>
  );
}