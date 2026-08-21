import Link from "next/link";
import "../../../styles/circuito.css";

export const metadata = {
  title: "El Circuito",
  description:
    "Conoce el formato de competición, categorías, sistema de puntos, ranking individual y Master Final de Sagunto Padel Cup.",
};

const TABLA = [
  { r: "Campeón Oro", p: [100, 82, 67, 55] },
  { r: "Subcampeón Oro", p: [88, 72, 59, 48] },
  { r: "Semifinalista Oro", p: [78, 64, 52, 43] },
  { r: "Cuartofinalista Oro", p: [70, 57, 47, 38] },
  { r: "Octavofinalista Oro", p: [64, 52, 43, 35] },
  { r: "Campeón Plata", p: [62, 51, 42, 34] },
  { r: "Subcampeón Plata", p: [54, 44, 36, 30] },
  { r: "Semifinalista Plata", p: [48, 39, 32, 26] },
  { r: "Cuartofinalista Plata", p: [44, 36, 29, 24] },
  { r: "Campeón Bronce", p: [42, 34, 28, 22] },
  { r: "Subcampeón Bronce", p: [36, 30, 24, 19] },
  { r: "Semifinalista Bronce", p: [32, 26, 21, 17] },
  { r: "Cuartofinalista Bronce", p: [28, 23, 19, 15] },
  { r: "Participación", p: [12, 10, 8, 6] },
];

const NAVEGACION = [
  {
    href: "#formato",
    numero: "01",
    titulo: "Formato",
  },
  {
    href: "#categorias",
    numero: "02",
    titulo: "Categorías",
  },
  {
    href: "#puntos",
    numero: "03",
    titulo: "Puntuación",
  },
  {
    href: "#ranking",
    numero: "04",
    titulo: "Ranking",
  },
  {
    href: "#master",
    numero: "05",
    titulo: "Master Final",
  },
];

export default function CircuitoPage() {
  return (
    <main className="circuito-page">
      <section
        className="circuito-hero"
        aria-labelledby="circuito-hero-title"
      >
        <div className="circuito-hero__inner">
          <div className="circuito-hero__copy">
            <p className="circuito-eyebrow">
              Sagunto Padel Cup
              <span aria-hidden="true" />
              El circuito
            </p>

            <p className="circuito-hero__section">
              01 / 05
            </p>

            <h1 id="circuito-hero-title">
              Una temporada.
              <br />
              Una clasificación.
              <br />
              Un objetivo.
            </h1>

            <p className="circuito-hero__lead">
              Sagunto Padel Cup reúne diferentes pruebas a lo largo de
              la temporada. Cada resultado suma para un ranking
              individual que construye el camino hacia el Master Final.
            </p>

            <div className="circuito-hero__actions">
              <a
                href="#formato"
                className="circuito-button circuito-button--primary"
              >
                Cómo funciona
              </a>

              <Link
                href="/ranking"
                className="circuito-button circuito-button--secondary"
              >
                Ver ranking
              </Link>
            </div>
          </div>

          <aside
            className="circuito-hero__facts"
            aria-label="Datos principales del circuito"
          >
            <div className="circuito-hero__fact circuito-hero__fact--featured">
              <span>Temporada</span>
              <strong>2026 / 2027</strong>
            </div>

            <div className="circuito-hero__fact">
              <span>Categorías</span>
              <strong>4</strong>
              <small>2ª · 3ª · 4ª · Iniciación</small>
            </div>

            <div className="circuito-hero__fact">
              <span>Ranking</span>
              <strong>365</strong>
              <small>Días de ventana móvil</small>
            </div>

            <div className="circuito-hero__fact">
              <span>Final</span>
              <strong>Master</strong>
              <small>Cierre competitivo de la temporada</small>
            </div>
          </aside>
        </div>

        <div
          className="circuito-hero__wordmark"
          aria-hidden="true"
        >
          CIRCUITO
        </div>

        <a
          href="#circuito-navegacion"
          className="circuito-hero__scroll"
          aria-label="Ir al contenido del circuito"
        >
          <span>Descubrir</span>
          <span
            className="circuito-hero__scroll-line"
            aria-hidden="true"
          />
        </a>
      </section>

      <div
        id="circuito-navegacion"
        className="circuito-content"
      >
        <nav
          aria-label="Secciones del circuito"
          className="circuito-nav"
        >
          <p className="circuito-nav__label">
            En esta página
          </p>

          <div className="circuito-nav__links">
            {NAVEGACION.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="circuito-nav__link"
              >
                <span>{item.numero}</span>
                <strong>{item.titulo}</strong>
              </a>
            ))}
          </div>
        </nav>

        <div className="circuito-sections">
          <section
            id="formato"
            className="circuito-section"
            aria-labelledby="formato-title"
          >
            <div className="circuito-section__index">
              01
            </div>

            <div className="circuito-section__body">
              <p className="circuito-eyebrow circuito-eyebrow--dark">
                Cómo se juega
              </p>

              <h2 id="formato-title">
                Formato de competición
              </h2>

              <p className="circuito-section__intro">
                Cada prueba combina una fase de grupos con una fase
                final. El formato está pensado para garantizar
                competición y continuidad durante el torneo.
              </p>

              <div className="circuito-rules">
                <article className="circuito-rule">
                  <span>01</span>

                  <div>
                    <h3>Fase de grupos</h3>

                    <p>
                      1 set con bola de oro. El empate a 5-5 se
                      resuelve con tie-break.
                    </p>
                  </div>
                </article>

                <article className="circuito-rule">
                  <span>02</span>

                  <div>
                    <h3>Fase final</h3>

                    <p>
                      Excepto la final, se juega a 9 juegos con bola
                      de oro. El empate a 8-8 se resuelve con
                      tie-break.
                    </p>
                  </div>
                </article>

                <article className="circuito-rule">
                  <span>03</span>

                  <div>
                    <h3>La final</h3>

                    <p>
                      El tercer set se sustituye por un super
                      tie-break.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section
            id="categorias"
            className="circuito-section circuito-section--dark"
            aria-labelledby="categorias-title"
          >
            <div className="circuito-section__index">
              02
            </div>

            <div className="circuito-section__body">
              <p className="circuito-eyebrow circuito-eyebrow--light">
                Competición
              </p>

              <h2 id="categorias-title">
                Cuatro categorías.
              </h2>

              <p className="circuito-section__intro circuito-section__intro--light">
                Cada categoría tiene su propia clasificación
                competitiva y su propio recorrido dentro del circuito.
              </p>

              <div className="circuito-category-grid">
                <div className="circuito-category">
                  <span>01</span>
                  <strong>2ª</strong>
                  <p>Competición avanzada.</p>
                </div>

                <div className="circuito-category">
                  <span>02</span>
                  <strong>3ª</strong>
                  <p>Competición intermedia.</p>
                </div>

                <div className="circuito-category">
                  <span>03</span>
                  <strong>4ª</strong>
                  <p>Competición amateur.</p>
                </div>

                <div className="circuito-category">
                  <span>04</span>
                  <strong>Iniciación</strong>
                  <p>Primer paso competitivo.</p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="puntos"
            className="circuito-section"
            aria-labelledby="puntos-title"
          >
            <div className="circuito-section__index">
              03
            </div>

            <div className="circuito-section__body">
              <p className="circuito-eyebrow circuito-eyebrow--dark">
                Cada resultado cuenta
              </p>

              <h2 id="puntos-title">
                Sistema de puntos
              </h2>

              <p className="circuito-section__intro">
                El ranking es móvil: los puntos de una prueba
                permanecen dentro de la ventana competitiva de 365
                días. La puntuación depende de la categoría y de la
                posición alcanzada en Oro, Plata o Bronce.
              </p>

              <div className="circuito-table-wrap">
                <table className="circuito-table">
                  <caption className="sr-only">
                    Tabla de puntos por resultado y categoría
                  </caption>

                  <thead>
                    <tr>
                      <th scope="col">Resultado</th>
                      <th scope="col">2ª</th>
                      <th scope="col">3ª</th>
                      <th scope="col">4ª</th>
                      <th scope="col">Iniciación</th>
                    </tr>
                  </thead>

                  <tbody>
                    {TABLA.map((fila) => (
                      <tr key={fila.r}>
                        <th scope="row">
                          {fila.r}
                        </th>

                        {fila.p.map((valor, index) => (
                          <td
                            key={`${fila.r}-${index}`}
                            className="tabular-nums"
                          >
                            {valor}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section
            id="ranking"
            className="circuito-section"
            aria-labelledby="ranking-title"
          >
            <div className="circuito-section__index">
              04
            </div>

            <div className="circuito-section__body">
              <p className="circuito-eyebrow circuito-eyebrow--dark">
                Clasificación individual
              </p>

              <h2 id="ranking-title">
                El ranking
                <br />
                se mueve contigo.
              </h2>

              <p className="circuito-section__intro">
                El ranking es individual, público y derivado de los
                resultados y las reglas de puntuación. Los puntos
                tienen una ventana móvil de 365 días.
              </p>

              <div className="circuito-ranking-highlight">
                <strong>365</strong>

                <div>
                  <span>DÍAS</span>

                  <p>
                    Los puntos dejan de formar parte del cálculo al
                    salir de la ventana competitiva.
                  </p>
                </div>
              </div>

              <Link
                href="/ranking"
                className="circuito-inline-link"
              >
                Consultar ranking
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          <section
            id="master"
            className="circuito-section circuito-section--master"
            aria-labelledby="master-title"
          >
            <div className="circuito-section__index">
              05
            </div>

            <div className="circuito-section__body">
              <p className="circuito-eyebrow circuito-eyebrow--light">
                El objetivo de la temporada
              </p>

              <h2 id="master-title">
                Master Final
              </h2>

              <p className="circuito-section__intro circuito-section__intro--light">
                El Master Final culmina la temporada. La plataforma
                debe mostrar de forma pública los criterios de
                clasificación, el corte y el estado de cada plaza
                cuando estén definidos.
              </p>

              <div className="circuito-master-grid">
                <div>
                  <span>Clasificación</span>
                  <strong>Race to Master</strong>
                </div>

                <div>
                  <span>Seguimiento</span>
                  <strong>
                    Durante toda la temporada
                  </strong>
                </div>

                <div>
                  <span>Objetivo</span>
                  <strong>Llegar al Master</strong>
                </div>
              </div>

              <Link
                href="/ranking/race-to-master"
                className="circuito-button circuito-button--light"
              >
                Ver Race to Master
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}