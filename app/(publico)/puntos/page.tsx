import type { Metadata } from "next";
import Link from "next/link";
import SimuladorPuntos from "@/components/puntos/SimuladorPuntos";
import {
  CATEGORIAS,
  CUADROS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_CUADRO,
  ETIQUETAS_RONDA,
  RONDAS,
} from "@/lib/constantes";
import { ESCALA } from "@/lib/puntos/escala";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Sistema de puntos",
  description: "Consulta la escala oficial de puntos por categoría, cuadro y ronda del Sagunto Padel Cup.",
};

export default function PaginaPuntos() {
  return (
    <main className={s.page}>
      <header className={s.hero}>
        <div className={s.heroInner}>
          <div>
            <p className={s.eyebrow}><span aria-hidden="true" /> Reglamento deportivo · SPC</p>
            <h1>Cada ronda<br /><em>cuenta.</em></h1>
            <p className={s.heroText}>La puntuación reconoce el recorrido de cada jugador en el circuito. Consulta la escala oficial o prueba distintos resultados.</p>
            <div className={s.heroActions}>
              <a className={s.primaryLink} href="#escala">Ver tabla oficial <span aria-hidden="true">↓</span></a>
              <Link className={s.secondaryLink} href="/ranking">Ir al ranking <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className={s.heroIndex} aria-hidden="true"><span>SPC</span><strong>PTS<br />/ 84</strong><small>Escala oficial<br />del circuito</small></div>
        </div>
      </header>

      <section className={s.principle} aria-labelledby="principio-puntos">
        <div className={s.principleHeading}><p className={s.kicker}>Una escala común</p><h2 id="principio-puntos">Los puntos siguen<br />el resultado.</h2></div>
        <div className={s.principleText}>
          <p>La puntuación de una prueba depende de tres datos: la categoría, el cuadro alcanzado y la ronda final.</p>
          <p>Los puntos se asignan una sola vez por pareja y torneo. Después, cada integrante recibe esa puntuación de forma individual.</p>
          <p>El ranking considera los resultados de los últimos 12 meses; el historial de puntos del jugador se conserva como dato acumulado.</p>
          <div className={s.factors} aria-label="Factores de la puntuación"><span>Categoría</span><b aria-hidden="true">×</b><span>Cuadro</span><b aria-hidden="true">×</b><span>Ronda</span></div>
        </div>
      </section>

      <section className={s.scaleSection} id="escala" aria-labelledby="titulo-escala">
        <div className={s.scaleHeading}>
          <div><p className={s.kicker}>Valores oficiales</p><h2 id="titulo-escala">Tabla de puntos</h2></div>
          <p>El valor mostrado corresponde<br />a cada jugador.</p>
        </div>
        <div className={s.categoryTables}>
          {CATEGORIAS.map((categoria) => (
            <section className={s.categoryTable} key={categoria} aria-labelledby={`categoria-${categoria}`}>
              <h3 id={`categoria-${categoria}`}>{ETIQUETAS_CATEGORIA[categoria]}</h3>
              <div className={s.tableFrame}>
                <table>
                  <caption className={s.srOnly}>{`Puntos de ${ETIQUETAS_CATEGORIA[categoria]} por cuadro y ronda`}</caption>
                  <thead><tr><th scope="col">Ronda</th>{CUADROS.map((cuadro) => <th key={cuadro} scope="col" className={cuadro === "oro" ? s.head_oro : cuadro === "plata" ? s.head_plata : s.head_bronce}>{ETIQUETAS_CUADRO[cuadro]}</th>)}</tr></thead>
                  <tbody>{RONDAS.map((ronda) => (
                    <tr key={ronda}><th scope="row">{ETIQUETAS_RONDA[ronda]}</th>{CUADROS.map((cuadro) => <td key={cuadro}>{ESCALA[ronda][categoria][cuadro]}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className={s.simulatorSection} aria-labelledby="titulo-simulador">
        <div className={s.simulatorCopy}>
          <p className={s.kicker}>Haz tu cálculo</p>
          <h2 id="titulo-simulador">¿Hasta dónde<br />llegarás?</h2>
          <p>Elige la categoría, el cuadro y la ronda. El resultado se actualiza al instante y muestra los puntos que recibe cada jugador.</p>
        </div>
        <SimuladorPuntos />
      </section>

      <section className={s.stepsSection} aria-labelledby="titulo-proceso">
        <div className={s.stepsHeading}><p className={s.kicker}>De la pista al ranking</p><h2 id="titulo-proceso">Así sumas puntos.</h2></div>
        <ol className={s.steps}>
          <li><span>01</span><strong>Participa</strong><p>Inscríbete en una prueba del circuito.</p></li>
          <li><span>02</span><strong>Compite</strong><p>Disputa tu categoría y cuadro.</p></li>
          <li><span>03</span><strong>Avanza</strong><p>El resultado final determina la ronda alcanzada.</p></li>
          <li><span>04</span><strong>Suma</strong><p>Cada integrante recibe individualmente los puntos de la pareja.</p></li>
          <li><span>05</span><strong>Acumula</strong><p>Los resultados entran en la clasificación según sus reglas y periodo.</p></li>
        </ol>
      </section>

      <footer className={s.footerCta}>
        <div><p className={s.kicker}>El siguiente paso</p><h2>Compite. Suma.<br />Sigue la carrera.</h2></div>
        <Link href="/ranking">Ver clasificación <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
