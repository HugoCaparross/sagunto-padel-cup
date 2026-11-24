import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./page.module.css";

export const metadata: Metadata = { title: "El circuito" };

const FORMATO = [
    { numero: "01", titulo: "Fase de grupos", texto: "Las parejas compiten en grupos. Con hasta cinco parejas se juega un grupo; desde seis, se organizan dos." },
    { numero: "02", titulo: "Cuadros finales", texto: "Al acabar los grupos, cada pareja pasa al cuadro que le corresponde y sigue compitiendo por el título." },
    { numero: "03", titulo: "Race al Máster", texto: "Los resultados suman para el ranking. Las parejas mejor clasificadas pelean por un puesto en el Máster Final." },
];

const CUADROS = [
    { nombre: "Oro", clase: s.oro, texto: "El cuadro principal. Las parejas compiten por el título y por los premios de la prueba." },
    { nombre: "Plata", clase: s.plata, texto: "Una nueva oportunidad para luchar por la victoria y sumar experiencia." },
    { nombre: "Bronce", clase: s.bronce, texto: "Más partidos y emoción hasta el final de la prueba para todas las parejas." },
];

export default function PaginaCircuito() {
    return (
        <main className={s.pagina}>
            <section className={s.hero}>
                <Image src="/images/padel-hero.jpg" alt="Pista de pádel preparada para jugar" fill priority sizes="100vw" className={s.heroImagen} />
                <div className={s.heroOverlay} />
                <div className={`container ${s.heroContenido}`}>
                    <p className={s.eyebrow}>Sagunto · Camp de Morvedre</p>
                    <h1>El pádel de aquí.<br /><span>Un circuito para vivirlo.</span></h1>
                    <p className={s.heroTexto}>Seis pruebas a lo largo de la temporada. Nuevos retos, grandes partidos y una comunidad que se encuentra en la pista.</p>
                    <div className={s.acciones}>
                        <Link href="/calendario" className={s.botonPrincipal}>Ver calendario <GoogleIcon name="arrow_forward" /></Link>
                        <Link href="/registro" className={s.botonClaro}>Únete al circuito</Link>
                    </div>
                    <a href="#formato" className={s.bajar}>Descubre cómo funciona <span aria-hidden="true">↓</span></a>
                </div>
            </section>

            <section id="formato" className={s.formato}>
                <div className="container">
                    <header className={s.cabeceraSeccion}>
                        <p className={s.eyebrowOscuro}>Tu temporada, punto a punto</p>
                        <h2>Compite a tu ritmo.<br /><span>Juega por algo más.</span></h2>
                        <p>Un formato pensado para disfrutar cada prueba y mantener la emoción durante toda la temporada.</p>
                    </header>
                    <ol className={s.pasos}>
                        {FORMATO.map((paso) => <li key={paso.numero}><span className={s.numero}>{paso.numero}</span><h3>{paso.titulo}</h3><p>{paso.texto}</p></li>)}
                    </ol>
                </div>
            </section>

            <section className={s.cuadros}>
                <div className={`container ${s.cuadrosGrid}`}>
                    <div className={s.cuadrosIntro}>
                        <p className={s.eyebrow}>Cada partido cuenta</p>
                        <h2>Tres cuadros.<br />Una gran final.</h2>
                        <p>Después de la fase de grupos, la competición continúa en cuadros adaptados a la clasificación. Cada pareja tiene un nuevo objetivo por el que jugar.</p>
                        <Link href="/reglamento" className={s.enlaceClaro}>Consulta el reglamento <GoogleIcon name="arrow_forward" /></Link>
                    </div>
                    <div className={s.cuadrosLista}>
                        {CUADROS.map((cuadro) => <article className={`${s.cuadro} ${cuadro.clase}`} key={cuadro.nombre}><span className={s.cuadroLinea} aria-hidden="true" /><div><h3>{cuadro.nombre}</h3><p>{cuadro.texto}</p></div><GoogleIcon name="arrow_outward" /></article>)}
                    </div>
                </div>
            </section>

            <section className={s.race}>
                <div className={`container ${s.raceGrid}`}>
                    <div><p className={s.eyebrowOscuro}>El camino al Máster</p><h2>Una temporada<br />que deja huella.</h2></div>
                    <div className={s.raceCopy}><p>Los puntos del ranking reflejan el rendimiento de los últimos 12 meses. Cada prueba es una oportunidad para escalar posiciones y acercarse al Máster Final.</p><p>Las parejas mejor clasificadas de cada categoría, con al menos dos pruebas disputadas, consiguen su plaza para la gran final.</p><Link href="/ranking" className={s.botonOscuro}>Explorar el ranking <GoogleIcon name="arrow_forward" /></Link></div>
                    <div className={s.raceDato}><strong>12</strong><span>meses de competición en el ranking</span></div><div className={s.raceDato}><strong>6</strong><span>pruebas para construir tu temporada</span></div>
                </div>
            </section>

            <section className={s.cierre}><div className="container"><p className={s.eyebrow}>Nos vemos en la pista</p><h2>Tu próxima prueba<br />empieza aquí.</h2><Link href="/calendario" className={s.botonClaro}>Encuentra tu próxima prueba <GoogleIcon name="arrow_forward" /></Link></div></section>
        </main>
    );
}
