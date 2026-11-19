import type { Metadata } from "next";
import SelectorPrueba from "@/components/patrocinio/SelectorPrueba";
import TarjetaPremio from "@/components/patrocinio/TarjetaPremio";
import { CATEGORIAS, ETIQUETAS_CATEGORIA } from "@/lib/constantes";
import {
  elegirPrueba,
  listarPruebasSelector,
  premiosDePrueba,
} from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Premios" };

type Props = {
  searchParams: Promise<{ prueba?: string }>;
};

export default async function PaginaPremios({ searchParams }: Props) {
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

  const premios = await premiosDePrueba(elegida.id);

  return (
    <main className="container space-y-10 py-12">
      <header className="space-y-4">
        <h1 className="heading-font text-6xl">Premios</h1>
        <p className="text-lg text-[#68737D]">
          Premios de cada cuadro. Algunos se revelan el día de la prueba.
        </p>
        <SelectorPrueba pruebas={pruebas} activaId={elegida.id} ruta="/premios" />
      </header>

      {premios.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
          Los premios de esta prueba se publicarán próximamente.
        </p>
      ) : (
        CATEGORIAS.map((c) => {
          const lista = premios.filter((p) => p.categoria === c);
          if (lista.length === 0) return null;

          return (
            <section key={c} className="space-y-4">
              <h2 className="heading-font text-3xl">{ETIQUETAS_CATEGORIA[c]}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lista.map((p) => (
                  <TarjetaPremio key={p.id} premio={p} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}