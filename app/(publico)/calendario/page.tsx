import type { Metadata } from "next";
import Link from "next/link";
import TarjetaPrueba from "@/components/pruebas/TarjetaPrueba";
import { listarPruebasPublicas } from "@/lib/pruebas/publico";
import estilos from "./page.module.css";

export const metadata: Metadata = { title: "Calendario" };

export default async function PaginaCalendario() {
  const pruebas = await listarPruebasPublicas();

  const proximas = pruebas.filter((p) => p.estado !== "finalizada");
  const finalizadas = pruebas.filter((p) => p.estado === "finalizada").reverse();

  return (
    <main className={`container ${estilos.pagina}`}>
      <header className={estilos.hero}>
        <div className={estilos.heroTexto}>
          <p className={estilos.eyebrow}>Sagunto Padel Cup · Temporada 2026-2027</p>
          <h1 className={`heading-font ${estilos.titulo}`}>Calendario de pruebas</h1>
          <p className={estilos.descripcion}>
            Organiza tu temporada: consulta fechas, categorías y detalles de cada prueba.
          </p>
        </div>
        <div className={estilos.resumen} role="group" aria-label="Resumen del calendario">
          <div className={estilos.resumenDato}>
            <span className={estilos.resumenNumero}>{proximas.length}</span>
            <span>por disputar</span>
          </div>
          <div className={estilos.resumenDato}>
            <span className={estilos.resumenNumero}>{finalizadas.length}</span>
            <span>finalizadas</span>
          </div>
        </div>
      </header>

      <nav className={estilos.accesos} aria-label="Secciones del calendario">
        <a href="#proximas" className={estilos.acceso}>
          Próximas pruebas <span aria-hidden="true">↓</span>
        </a>
        {finalizadas.length > 0 && (
          <a href="#finalizadas" className={estilos.acceso}>
            Resultados anteriores <span aria-hidden="true">↓</span>
          </a>
        )}
      </nav>

      <section id="proximas" className={estilos.seccion}>
        <div className={estilos.cabeceraSeccion}>
          <div>
            <p className={estilos.eyebrow}>Prepara tu siguiente partido</p>
            <h2 className={`heading-font ${estilos.tituloSeccion}`}>Próximas pruebas</h2>
          </div>
          <span className={estilos.contador}>
            {proximas.length} {proximas.length === 1 ? "prueba" : "pruebas"}
          </span>
        </div>

        {proximas.length === 0 ? (
          <div className={estilos.vacio}>
            <h3 className="heading-font">Todavía no hay nuevas fechas</h3>
            <p>
              Estamos preparando las próximas pruebas. Mientras tanto, descubre cómo funciona el
              circuito.
            </p>
            <Link href="/circuito" className={estilos.enlace}>
              Conoce el circuito <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <div className={estilos.rejilla}>
            {proximas.map((p) => (
              <TarjetaPrueba key={p.id} prueba={p} />
            ))}
          </div>
        )}
      </section>

      {finalizadas.length > 0 && (
        <section id="finalizadas" className={estilos.seccion}>
          <div className={estilos.cabeceraSeccion}>
            <div>
              <p className={estilos.eyebrow}>Revive la temporada</p>
              <h2 className={`heading-font ${estilos.tituloSeccion}`}>Pruebas finalizadas</h2>
            </div>
            <span className={estilos.contador}>
              {finalizadas.length} {finalizadas.length === 1 ? "prueba" : "pruebas"}
            </span>
          </div>
          <div className={estilos.rejilla}>
            {finalizadas.map((p) => (
              <TarjetaPrueba key={p.id} prueba={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}