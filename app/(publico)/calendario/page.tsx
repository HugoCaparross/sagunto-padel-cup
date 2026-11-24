import type { Metadata } from "next";
import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { listarPruebasPublicas } from "@/lib/pruebas/publico";
import CalendarBrowser from "./CalendarBrowser";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Calendario" };

export default async function PaginaCalendario() {
  const pruebas = await listarPruebasPublicas();
  const proximas = pruebas.filter((p) => p.estado !== "finalizada");
  const categorias = new Set(pruebas.flatMap((prueba) => prueba.categorias));

  return <main className={s.pagina}>
    <header className={s.hero}>
      <div className={`container ${s.heroContenido}`}>
        <div className={s.heroTexto}>
          <p className={s.eyebrow}>Sagunto Padel Cup · Temporada 2026–2027</p>
          <h1>Tu próxima prueba.<br /><span>Tres fechas claras.</span></h1>
          <p className={s.descripcion}>Consulta cuándo abren las inscripciones, cuándo cierran y el día exacto del torneo. Sin perderte entre fechas.</p>
          <a href="#calendario" className={s.bajar}>Ver fechas importantes <GoogleIcon name="arrow_downward" /></a>
        </div>
        <div className={s.heroEstadisticas}><div><strong>{pruebas.length}</strong><span>pruebas publicadas</span></div><div><strong>{proximas.length}</strong><span>por disputar</span></div><div><strong>{categorias.size}</strong><span>categorías</span></div></div>
      </div>
      <div className={s.heroDeco} aria-hidden="true"><span /><span /><span /></div>
    </header>
    <div id="calendario" className={s.seccionCalendario}><div className="container"><CalendarBrowser pruebas={pruebas} /></div></div>
    <section className={s.ctaFinal}><div className="container"><div><p className={s.eyebrow}>¿Primera vez en el circuito?</p><h2>Tu temporada<br />empieza aquí.</h2><p>Descubre cómo funciona el formato y prepárate para saltar a la pista.</p></div><Link href="/circuito" className={s.botonClaro}>Conoce el circuito <GoogleIcon name="arrow_forward" /></Link></div></section>
  </main>;
}
