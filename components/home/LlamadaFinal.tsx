import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

export default function LlamadaFinal() {
    return (
        <section className={`${s.section} ${s.ctaFinalSection}`}>
            <div className={`container ${s.ctaFinal}`}>
                <p className={s.ctaFinalEyebrow}>Sagunto Padel Cup · Vive el circuito</p>
                <h2 className={s.ctaFinalTitulo}>Tu próximo partido te espera</h2>
                <p className={s.ctaFinalTexto}>
                    Elige categoría, encuentra tu prueba y suma puntos durante toda la temporada.
                </p>
                <Link href="/calendario" className={s.ctaFinalBoton}>
                    Ver próximas pruebas
                    <GoogleIcon name="arrow_forward" />
                </Link>
            </div>
        </section>
    );
}
