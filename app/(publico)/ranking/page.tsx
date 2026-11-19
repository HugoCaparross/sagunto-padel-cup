import type { Metadata } from "next";
import PestanasCategoria from "@/components/ranking/PestanasCategoria";
import TablaRankingPublica from "@/components/ranking/TablaRankingPublica";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import { obtenerRankingPublico } from "@/lib/ranking/publico";
import { hoyEnMadrid } from "@/lib/ranking/cargar";

export const metadata: Metadata = { title: "Ranking" };

type Props = {
  searchParams: Promise<{ categoria?: string; corte?: string }>;
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default async function PaginaRanking({ searchParams }: Props) {
  const sp = await searchParams;

  const categoria = (CATEGORIAS as readonly string[]).includes(sp.categoria ?? "")
    ? (sp.categoria as Categoria)
    : "segunda";

  const hoy = hoyEnMadrid();
  // Una fecha de corte futura no tiene sentido: se usa hoy
  const corte = sp.corte && FECHA.test(sp.corte) && sp.corte <= hoy ? sp.corte : hoy;

  const filas = await obtenerRankingPublico(categoria, corte);

  return (
    <main className="container space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="heading-font text-5xl">Ranking</h1>
        <p className="text-sm text-[#68737D]">
          Puntos por jugador de los últimos 12 meses, a fecha {fechaLarga(corte)}.
        </p>
      </header>

      <PestanasCategoria activa={categoria} corte={corte} />

      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <input type="hidden" name="categoria" value={categoria} />
        <label className="flex flex-col gap-1">
          <span className="text-[#68737D]">Ver a fecha</span>
          <input
            type="date"
            name="corte"
            defaultValue={corte}
            max={hoy}
            className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[#0D1B2A] px-3 py-2 text-white">
          Ver
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">{ETIQUETAS_CATEGORIA[categoria]}</h2>
        <TablaRankingPublica filas={filas} />
      </section>
    </main>
  );
}