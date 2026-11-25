import type { Metadata } from "next";
import Link from "next/link";
import PestanasCategoria from "@/components/ranking/PestanasCategoria";
import PodioRanking from "@/components/ranking/PodioRanking";
import TablaRankingPublica from "@/components/ranking/TablaRankingPublica";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import { obtenerRankingPublico } from "@/lib/ranking/publico";
import { hoyEnMadrid } from "@/lib/ranking/cargar";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Consulta la clasificación individual del Race To Master Sagunto Padel Cup.",
};

type Props = {
  searchParams: Promise<{ categoria?: string; corte?: string }>;
};

function fechaValida(valor?: string): valor is string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

export default async function PaginaRanking({ searchParams }: Props) {
  const sp = await searchParams;
  const categoria: Categoria = (CATEGORIAS as readonly string[]).includes(sp.categoria ?? "")
    ? (sp.categoria as Categoria)
    : "segunda";
  const hoy = hoyEnMadrid();
  const corteSolicitado = fechaValida(sp.corte) && sp.corte <= hoy ? sp.corte : hoy;
  const filas = await obtenerRankingPublico(categoria, corteSolicitado);

  return (
    <main className={s.page}>
      <header className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}><span aria-hidden="true" /> Race To Master · Sagunto Padel Cup</p>
            <h1>El circuito<br /><em>se mide aquí.</em></h1>
            <p className={s.heroText}>
              La clasificación individual del Race To Master. Cada punto cuenta y cada jugador suma su propio camino.
            </p>
            <div className={s.heroActions}>
              <a className={s.primaryLink} href="#clasificacion">Ver clasificación <span aria-hidden="true">↓</span></a>
              <Link className={s.secondaryLink} href="/puntos">Cómo se puntúa <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className={s.heroMark} aria-hidden="true">
            <span className={s.markIndex}>SPC / 01</span>
            <span className={s.markLetters}>R<br />T<br />M</span>
            <span className={s.markCaption}>Race<br />To Master</span>
          </div>
        </div>
      </header>

      <section className={s.intro} aria-labelledby="que-es-ranking">
        <div>
          <p className={s.kicker}>La competición, punto a punto</p>
          <h2 id="que-es-ranking">Un recorrido.<br />Una clasificación individual.</h2>
        </div>
        <div className={s.introDetails}>
          <p>Los resultados de cada prueba suman puntos a cada jugador de la pareja. La categoría, el cuadro y la ronda alcanzada determinan la puntuación.</p>
          <p>Consulta los resultados de los últimos 12 meses desde cualquier fecha pasada. La fecha de corte mantiene la categoría seleccionada.</p>
          <Link href="/puntos">Consulta la tabla oficial de puntos <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={s.competition} id="clasificacion" aria-labelledby="titulo-clasificacion">
        <div className={s.sectionHeader}>
          <div>
            <p className={s.kicker}>Race To Master</p>
            <h2 id="titulo-clasificacion">Clasificación</h2>
          </div>
          <p className={s.cutoff}>Puntos acumulados hasta el <strong>{fechaLarga(corteSolicitado)}</strong><br />Ventana móvil de 12 meses</p>
        </div>

        <div className={s.filters}>
          <PestanasCategoria activa={categoria} corte={corteSolicitado} />
          <form method="get" className={s.dateForm}>
            <input type="hidden" name="categoria" value={categoria} />
            <label htmlFor="fecha-corte">Ver clasificación a fecha</label>
            <input id="fecha-corte" type="date" name="corte" defaultValue={corteSolicitado} max={hoy} />
            <button type="submit">Actualizar</button>
          </form>
        </div>

        <div className={s.categoryHeading}>
          <div><span className={s.categoryDot} aria-hidden="true" /><h3>{ETIQUETAS_CATEGORIA[categoria]}</h3></div>
          <span>{filas.length} {filas.length === 1 ? "jugador" : "jugadores"}</span>
        </div>

        <PodioRanking filas={filas.slice(0, 3)} />
        <TablaRankingPublica filas={filas} />
      </section>

      <footer className={s.footerCta}>
        <div><p className={s.kicker}>Cada partido deja huella</p><h2>Entiende cómo<br />se gana cada punto.</h2></div>
        <Link href="/puntos">Explorar el sistema de puntos <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
