"use client";

import { useState } from "react";
import Link from "next/link";

type Categoria = {
  orden: string;
  nombre: string;
  texto: string;
};

type Punto = readonly [string, readonly number[]];
type Proceso = readonly [string, string, string];

type Props = {
  categorias: Categoria[];
  puntos: readonly Punto[];
  proceso: readonly Proceso[];
};

const OPTIONS = [
  ["como-funciona", "Cómo funciona"],
  ["formato", "Formato"],
  ["categorias", "Categorías"],
  ["puntos", "Puntos"],
  ["ranking", "Ranking"],
  ["master", "Master Final"],
  ["premios", "Premios"],
] as const;

export default function CircuitoTabs({ categorias, puntos, proceso }: Props) {
  const [active, setActive] = useState("como-funciona");

  return (
    <section className="circuito-dynamic" aria-label="Información del circuito">
      <div className="circuito-tabs" role="tablist" aria-label="Secciones del circuito">
        <div className="circuito-container circuito-tabs__inner">
          {OPTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active === id}
              aria-controls={`circuito-panel-${id}`}
              className={`circuito-tab${active === id ? " is-active" : ""}`}
              onClick={() => setActive(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="circuito-dynamic__content">
        {active === "como-funciona" && (
          <div id="circuito-panel-como-funciona" className="circuito-panel">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-section-heading">
                <p className="circuito-label">CÓMO FUNCIONA</p>
                <h2>Cada prueba cuenta.</h2>
                <p>
                  Cada prueba es una competición independiente, pero sus resultados
                  tienen continuidad a través del ranking individual y la carrera hacia el Master Final.
                </p>
              </div>
              <div className="circuito-process">
                {proceso.map(([number, title, text]) => (
                  <article key={number}>
                    <span>{number}</span>
                    <div><h3>{title}</h3><p>{text}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === "formato" && (
          <div id="circuito-panel-formato" className="circuito-panel circuito-panel--dark">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-split">
                <div className="circuito-section-heading circuito-section-heading--dark">
                  <p className="circuito-label circuito-label--green">FORMATO DE COMPETICIÓN</p>
                  <h2>Una prueba.<br />Varias fases.</h2>
                </div>
                <div className="circuito-copy circuito-copy--dark">
                  <p>El formato combina una fase de grupos con fases finales para ordenar la competición en los tramos Oro, Plata y Bronce.</p>
                  <div className="circuito-format-list">
                    <article><span>01</span><div><h3>Fase de grupos</h3><p>Se disputa a 1 set con bola de oro. El empate a 5-5 se resuelve mediante tie-break.</p></div></article>
                    <article><span>02</span><div><h3>Fase final</h3><p>Salvo la final, se juega a 9 juegos con bola de oro. El empate a 8-8 se resuelve mediante tie-break.</p></div></article>
                    <article><span>03</span><div><h3>La final</h3><p>La final utiliza un super tie-break como tercer set en lugar de disputar un tercer set completo.</p></div></article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "categorias" && (
          <div id="circuito-panel-categorias" className="circuito-panel">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-section-heading">
                <p className="circuito-label">CATEGORÍAS</p>
                <h2>Encuentra<br />tu categoría.</h2>
                <p>El circuito cuenta con cuatro categorías competitivas. Cada una mantiene su clasificación y sus resultados de forma independiente.</p>
              </div>
              <div className="circuito-category-grid">
                {categorias.map((categoria) => (
                  <article key={categoria.nombre} className="circuito-category">
                    <span>{categoria.orden}</span><h3>{categoria.nombre}</h3><p>{categoria.texto}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === "puntos" && (
          <div id="circuito-panel-puntos" className="circuito-panel">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-section-heading circuito-section-heading--wide">
                <p className="circuito-label">SISTEMA DE PUNTOS</p>
                <h2>Cada resultado<br />tiene un valor.</h2>
                <p>Los puntos se asignan individualmente según el resultado alcanzado y la categoría del jugador. Cada punto permanece vigente durante 365 días.</p>
              </div>
              <div className="circuito-table-wrap">
                <table className="circuito-points-table">
                  <caption className="circuito-sr-only">Tabla de puntos por resultado y categoría</caption>
                  <thead><tr><th>Resultado</th><th>2ª</th><th>3ª</th><th>4ª</th><th>Iniciación</th></tr></thead>
                  <tbody>
                    {puntos.map(([resultado, valores]) => (
                      <tr key={resultado}>
                        <th scope="row">{resultado}</th>
                        {valores.map((valor, index) => <td key={`${resultado}-${index}`}>{valor}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === "ranking" && (
          <div id="circuito-panel-ranking" className="circuito-panel circuito-panel--soft">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-split">
                <div className="circuito-section-heading">
                  <p className="circuito-label">RANKING INDIVIDUAL</p>
                  <h2>Tu resultado.<br />Tu posición.</h2>
                </div>
                <div className="circuito-copy">
                  <p>El ranking es individual y público. Se construye a partir de los resultados de las pruebas y de las reglas de puntuación vigentes.</p>
                  <p>La clasificación se consulta por categoría y utiliza únicamente los puntos que permanecen dentro de la ventana móvil de 365 días.</p>
                  <div className="circuito-highlight"><span>365 DÍAS</span><strong>Una clasificación viva durante toda la temporada.</strong></div>
                  <Link href="/ranking" className="circuito-inline-link">Consultar ranking</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "master" && (
          <div id="circuito-panel-master" className="circuito-panel circuito-panel--dark">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-master-head">
                <div className="circuito-section-heading circuito-section-heading--dark">
                  <p className="circuito-label circuito-label--green">MASTER FINAL</p>
                  <h2>El cierre<br />de la temporada.</h2>
                </div>
                <p>El Master Final es el evento de cierre competitivo del circuito. La clasificación y las plazas se determinan según los criterios publicados por la organización.</p>
              </div>
              <div className="circuito-master-grid">
                <article><span>01</span><h3>Ranking</h3><p>La clasificación individual permite seguir la posición de cada jugador durante la temporada.</p></article>
                <article><span>02</span><h3>Clasificación</h3><p>Los criterios, corte y plazas aplicables se publican en la información oficial del Master Final.</p></article>
                <article><span>03</span><h3>Competición</h3><p>Los jugadores clasificados disputan la gran cita que cierra la temporada.</p></article>
              </div>
              <div className="circuito-actions">
                <Link href="/master-final" className="circuito-button circuito-button--primary">Ver Master Final</Link>
                <Link href="/ranking/race-to-master" className="circuito-button circuito-button--secondary">Race to Master</Link>
              </div>
            </div>
          </div>
        )}

        {active === "premios" && (
          <div id="circuito-panel-premios" className="circuito-panel">
            <div className="circuito-container circuito-panel__inner">
              <div className="circuito-split">
                <div className="circuito-section-heading">
                  <p className="circuito-label">PREMIOS</p>
                  <h2>Competir<br />tiene recompensa.</h2>
                </div>
                <div className="circuito-copy">
                  <p>Las pruebas cuentan con premios asociados a los resultados de la competición. Los premios concretos de cada prueba deben consultarse en la información publicada para ese torneo.</p>
                  <div className="circuito-prize-lines">
                    <div><span>ORO</span><p>Primer tramo competitivo.</p></div>
                    <div><span>PLATA</span><p>Segundo tramo competitivo.</p></div>
                    <div><span>BRONCE</span><p>Tercer tramo competitivo.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}