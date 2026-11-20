import Link from "next/link";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

const VENTAJAS = [
    {
        titulo: "Pruebas periódicas",
        texto: "Competiciones durante toda la temporada.",
        icono: "calendar_month",
        href: "/calendario",
    },
    {
        titulo: "Ranking individual",
        texto: "Suma puntos en cada prueba y mejora tu posición.",
        icono: "leaderboard",
        href: "/ranking",
    },
    {
        titulo: "Race To Master",
        texto: "Accede a la Master Final según tu ranking.",
        icono: "trending_up",
        href: "/puntos",
    },
    {
        titulo: "Master Final",
        texto: "Cierra la temporada con los mejores jugadores.",
        icono: "emoji_events",
        href: "/premios",
    },
] satisfies { titulo: string; texto: string; icono: GoogleIconName; href: string }[];

const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate, confirma tu email y completa tu perfil una sola vez.",
        icono: "person_add",
    },
    {
        titulo: "Elige prueba y categoría",
        texto: "Inscríbete en la prueba que quieras. Si vas con pareja, tu compañero se une desde el tablón.",
        icono: "event_available",
    },
    {
        titulo: "Paga en efectivo",
        texto: "El pago se hace el primer día de la prueba. Tu plaza se confirma cuando el organizador la valida.",
        icono: "payments",
    },
] satisfies { titulo: string; texto: string; icono: GoogleIconName }[];

export default function ElCircuito() {
    return (
        <section id="circuito" className={`${s.section} ${s.sectionDark}`}>
            <div className="container">
                <header className={`${s.sectionCabecera} ${s.sectionCabeceraCentro}`}>
                    <h2 className={s.sectionTitle}>El Circuito</h2>
                    <p className={s.sectionText}>
                        Un formato de pruebas regulares, con ranking individual y una gran Master Final.
                    </p>
                </header>

                <div className={s.featureGrid}>
                    {VENTAJAS.map((v) => (
                        <Link key={v.titulo} href={v.href} className={s.feature}>
                            <span className={s.featureIcon}>
                                <GoogleIcon name={v.icono} />
                            </span>
                            <h3 className={s.featureTitle}>{v.titulo}</h3>
                            <p className={s.featureText}>{v.texto}</p>
                            <span className={s.featureLink}>
                                Explorar
                                <GoogleIcon name="arrow_forward" />
                            </span>
                        </Link>
                    ))}
                </div>

                <div className={s.pasosCabecera}>
                    <span>Empieza a competir</span>
                    <h3 className="heading-font">Tres pasos para jugar</h3>
                </div>
                <ol className={s.pasos} aria-label="Cómo inscribirte">
                    {PASOS.map((p, i) => (
                        <li key={p.titulo} className={s.paso}>
                            <span className={s.pasoIcono}>
                                <GoogleIcon name={p.icono} />
                            </span>
                            <div className="space-y-1">
                                <span className={s.pasoNum}>Paso {i + 1}</span>
                                <p className={s.pasoTitulo}>{p.titulo}</p>
                                <p className={s.pasoTexto}>{p.texto}</p>
                            </div>
                        </li>
                    ))}
                </ol>
                <Link href="/registro" className={`btn btn-primario ${s.pasosCta}`}>
                    Crear mi cuenta
                    <GoogleIcon name="arrow_forward" />
                </Link>
            </div>
        </section>
    );
}