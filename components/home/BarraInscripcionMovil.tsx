import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = {
    slug: string;
    nombre: string;
    abierta: boolean;
    plazasLibres: number;
    plazasMaximas: number;
};

// Solo aparece en móvil y cuando la prueba tiene inscripciones abiertas.
export default function BarraInscripcionMovil({
    slug,
    nombre,
    abierta,
    plazasLibres,
    plazasMaximas,
}: Props) {
    if (!abierta) return null;

    return (
        <div className={s.barraMovil} role="region" aria-label="Inscripción rápida">
            <p className={s.barraMovilTexto}>
                <strong>{nombre}</strong>
                <span>
                    <GoogleIcon name="event_available" />
                {plazasLibres > 0
                    ? `${plazasLibres} de ${plazasMaximas} plazas libres`
                    : "Completa: lista de espera"}
                </span>
            </p>
            <Link href={`/inscribirse/${slug}`} className="btn btn-primario shrink-0">
                <GoogleIcon name="sports_tennis" />
                {plazasLibres > 0 ? "Inscribirme" : "Apuntarme a lista de espera"}
            </Link>
        </div>
    );
}
