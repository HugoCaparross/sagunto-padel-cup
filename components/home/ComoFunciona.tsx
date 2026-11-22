import Link from "next/link";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate, confirma tu email y completa tu perfil una sola vez.",
        icono: "person_add",
    },
    {
        titulo: "Elige prueba y categoría",
        texto: "Inscríbete en la prueba que te interese. Si vas con pareja, tu compañero se une desde el tablón.",
        icono: "event_available",
    },
    {
        titulo: "Paga en la prueba",
        texto: "El pago es en efectivo el primer día. Tu plaza se confirma cuando el organizador la valida.",
        icono: "payments",
    },
] satisfies { titulo: string; texto: string; icono: GoogleIconName }[];

export default function ComoFunciona() {
    return (
        <section id="como-jugar" className={`${s.section} ${s.sectionDark}`}>
            <div className="container">
                <header className={s.comoFuncionaCabecera}>
                    <p className={s.proximaEyebrow}>Empieza a competir</p>
                    <h2 className={s.sectionTitle}>Tres pasos para jugar</h2>
                    <p className={s.sectionText}>
                        Crea tu cuenta, elige una prueba y salta a la pista.
                    </p>
                </header>

                <ol className={s.pasos} aria-label="Cómo inscribirte">
                    {PASOS.map((paso, index) => (
                        <li key={paso.titulo} className={s.paso}>
                            <span className={s.pasoIcono}>
                                <GoogleIcon name={paso.icono} />
                            </span>
                            <div className="space-y-1">
                                <span className={s.pasoNum}>Paso {index + 1}</span>
                                <p className={s.pasoTitulo}>{paso.titulo}</p>
                                <p className={s.pasoTexto}>{paso.texto}</p>
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
