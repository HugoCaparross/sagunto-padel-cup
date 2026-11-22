import Image from "next/image";
import Link from "next/link";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate, confirma tu email y completa tu perfil.",
        icono: "person_add",
        imagen: "/images/padel-player.jpg",
        href: "/registro",
    },
    {
        titulo: "Elige prueba y categoría",
        texto: "Encuentra una fecha y una categoría que encajen contigo.",
        icono: "event_available",
        imagen: "/images/padel-court.jpg",
        href: "/calendario",
    },
    {
        titulo: "Paga en la prueba",
        texto: "Tu plaza queda confirmada con el organizador el primer día.",
        icono: "payments",
        imagen: "/images/padel-woman.jpg",
        href: "/calendario",
    },
] satisfies {
    titulo: string;
    texto: string;
    icono: GoogleIconName;
    imagen: string;
    href: string;
}[];

export default function ComoFunciona() {
    return (
        <section id="como-jugar" className={`${s.section} ${s.sectionLight}`}>
            <div className="container">
                <header className={s.pasosCabecera}>
                    <div>
                        <p className={s.circuitoEyebrow}>Empieza a competir</p>
                        <h2 className={s.sectionTitle}>Tres pasos para jugar</h2>
                    </div>
                    <p className={s.sectionText}>
                        De tu primera inscripción a tu próximo partido, todo empieza aquí.
                    </p>
                </header>

                <ol className={s.pasos} aria-label="Cómo inscribirte">
                    {PASOS.map((paso, index) => (
                        <li key={paso.titulo}>
                            <Link href={paso.href} className={s.paso}>
                                <span className={s.pasoImagen}>
                                    <Image
                                        src={paso.imagen}
                                        alt=""
                                        fill
                                        sizes="(max-width: 760px) 100vw, 33vw"
                                    />
                                </span>
                                <span className={s.pasoContenido}>
                                    <span className={s.pasoIcono} aria-hidden="true">
                                        <GoogleIcon name={paso.icono} />
                                    </span>
                                    <span className={s.pasoNum}>Paso 0{index + 1}</span>
                                    <strong className={s.pasoTitulo}>{paso.titulo}</strong>
                                    <span className={s.pasoTexto}>{paso.texto}</span>
                                    <span className={s.pasoFlecha} aria-hidden="true">
                                        <GoogleIcon name="arrow_outward" />
                                    </span>
                                </span>
                            </Link>
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
