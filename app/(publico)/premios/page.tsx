import type { Metadata } from "next";
import Link from "next/link";
import SelectorPrueba from "@/components/patrocinio/SelectorPrueba";
import TarjetaPremio from "@/components/patrocinio/TarjetaPremio";
import CabeceraPagina from "@/components/ui/CabeceraPagina";
import LlamadaFinal from "@/components/ui/LlamadaFinal";
import Migas from "@/components/ui/Migas";
import Seccion from "@/components/ui/Seccion";
import Vacio from "@/components/ui/Vacio";
import { CATEGORIAS, ETIQUETAS_CATEGORIA } from "@/lib/constantes";
import { elegirPrueba, listarPruebasSelector, premiosDePrueba } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Premios" };
type Props = { searchParams: Promise<{ prueba?: string }> };

export default async function PaginaPremios({ searchParams }: Props) {
  const { prueba: slug } = await searchParams;
  const pruebas = await listarPruebasSelector();
  const elegida = elegirPrueba(pruebas, slug);
  const premios = elegida ? await premiosDePrueba(elegida.id) : [];

  return <main>
    <Migas items={[{ texto: "Premios" }]} />
    <CabeceraPagina eyebrow="Reconocimientos" titulo="Premios de cada prueba" descripcion="Cada resultado tiene su recompensa. Consulta los premios asignados a cada categoría." />
    <Seccion variante="alterna">
      {pruebas.length > 0 && <div className="mb-8 max-w-2xl"><SelectorPrueba pruebas={pruebas} activaId={elegida?.id ?? ""} ruta="/premios" /></div>}
      {!elegida ? <Vacio titulo="Todavía no hay pruebas publicadas" texto="Cuando se publique el calendario, aquí podrás consultar los premios de cada prueba." cta={<Link href="/calendario" className="btn btn-primario">Ver calendario</Link>} /> : premios.length === 0 ? <Vacio titulo="Premios por confirmar" texto="Los premios de esta prueba se publicarán más adelante." /> : CATEGORIAS.map((categoria) => {
        const lista = premios.filter((premio) => premio.categoria === categoria);
        if (!lista.length) return null;
        return <section key={categoria} className="mb-10 last:mb-0" aria-labelledby={`premios-${categoria}`}>
          <h2 id={`premios-${categoria}`} className="spc-h2 mb-5">{ETIQUETAS_CATEGORIA[categoria]}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lista.map((premio) => <TarjetaPremio key={premio.id} premio={premio} />)}</div>
        </section>;
      })}
    </Seccion>
    <LlamadaFinal titulo="Vive el circuito" texto="Descubre las próximas pruebas, compite y suma puntos esta temporada." cta={<Link href="/calendario" className="btn btn-primario">Ver calendario</Link>} />
  </main>;
}
