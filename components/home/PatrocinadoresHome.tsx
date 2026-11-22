import type { PatrocinadorPublico } from "@/lib/patrocinio/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import Image from "next/image";
import s from "./home.module.css";

type Props = {
    patrocinadores: PatrocinadorPublico[];
    nombrePrueba: string | null;
};

function LogoPatro({ p, grande = false }: { p: PatrocinadorPublico; grande?: boolean }) {
    const logo = p.logoUrl ? (
        <Image
            src={p.logoUrl}
            alt={p.nombre}
            width={208}
            height={68}
            unoptimized
            loading="lazy"
            className={`${s.patroLogo} ${grande ? s.patroLogoGrande : ""}`}
        />
    ) : (
        <span className={s.patroLogoTexto}>
            <GoogleIcon name={p.tipo === "institucional" ? "account_balance" : "sports_tennis"} />
            {p.nombre}
        </span>
    );

    if (!p.webUrl) {
        return <div className={s.patroEnlace}>{logo}</div>;
    }

    return (
        <a
            href={p.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.nombre} (se abre en otra pestaña)`}
            className={s.patroEnlace}
        >
            {logo}
        </a>
    );
}

export default function PatrocinadoresHome({ patrocinadores, nombrePrueba }: Props) {
    const institucionales = patrocinadores.filter((p) => p.tipo === "institucional");
    const comerciales = patrocinadores.filter((p) => p.tipo === "comercial");

    return (
        <section className={`${s.section} ${s.sectionLight}`}>
            <div className={`container ${s.patroGrid}`}>
                <header className="space-y-4">
                    <p className={s.proximaEyebrow}>Juntos hacemos crecer el circuito</p>
                    <h2 className={s.sectionTitle}>Patrocinadores y colaboradores</h2>
                    <p className={s.sectionText}>
                        {nombrePrueba
                            ? `Gracias a quienes apoyan cada prueba, como ${nombrePrueba}.`
                            : "Gracias a las entidades y negocios que apoyan el pádel local."}
                    </p>
                </header>

                <div className="space-y-6">
                    {institucionales.length > 0 && (
                        <ul className={s.patroInst}>
                            {institucionales.map((p) => (
                                <li key={p.id}>
                                    <LogoPatro p={p} grande />
                                </li>
                            ))}
                        </ul>
                    )}

                    {comerciales.length > 0 && (
                        <ul className={s.patroCom}>
                            {comerciales.map((p) => (
                                <li key={p.id}>
                                    <LogoPatro p={p} />
                                </li>
                            ))}
                        </ul>
                    )}
                    {patrocinadores.length === 0 && (
                        <div className={s.patroVacio}>
                            <GoogleIcon name="group" />
                            <div>
                                <h3>¿Quieres apoyar el circuito?</h3>
                                <p>Escríbenos y te contamos cómo colaborar con Sagunto Padel Cup.</p>
                            </div>
                            <a href="mailto:saguntopadelcup@gmail.com">
                                Contactar
                                <GoogleIcon name="arrow_forward" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}