import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { PATROCINADORES_LOCALES } from "@/lib/home/patrocinadores-locales";
import type { HistoricoPatrocinador, PatrocinadorPublico } from "@/lib/patrocinio/publico";
import s from "./home.module.css";

type Props = { historial: HistoricoPatrocinador[] };

type PatrocinadorTarjeta = {
    id: string;
    nombre: string;
    logoUrl: string;
    webUrl: string | null;
    tipo: PatrocinadorPublico["tipo"];
    fondoOscuro: boolean;
    pruebas: { id: string; nombre: string }[];
};

function normalizarNombre(nombre: string): string {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function obtenerPatrocinadores(historial: HistoricoPatrocinador[]): PatrocinadorTarjeta[] {
    const tarjetas = new Map<string, PatrocinadorTarjeta>();

    for (const { prueba, patrocinadores } of historial) {
        for (const patrocinador of patrocinadores) {
            const logoLocal = PATROCINADORES_LOCALES.find(
                (local) => normalizarNombre(local.nombre) === normalizarNombre(patrocinador.nombre)
            );
            const tarjeta = tarjetas.get(patrocinador.id);

            if (tarjeta) {
                if (!tarjeta.pruebas.some((p) => p.id === prueba.id)) {
                    tarjeta.pruebas.push({ id: prueba.id, nombre: prueba.nombre });
                }
                continue;
            }

            tarjetas.set(patrocinador.id, {
                id: patrocinador.id,
                nombre: patrocinador.nombre,
                logoUrl: patrocinador.logoUrl.trim() || logoLocal?.logoUrl || "",
                webUrl: patrocinador.webUrl,
                tipo: patrocinador.tipo,
                fondoOscuro: logoLocal?.fondoOscuro ?? false,
                pruebas: [{ id: prueba.id, nombre: prueba.nombre }],
            });
        }
    }

    return [...tarjetas.values()];
}

function LogoPatro({
    p,
    oculto = false,
}: {
    p: PatrocinadorTarjeta;
    oculto?: boolean;
}) {
    const logo = p.logoUrl ? (
        <Image
            src={p.logoUrl}
            alt=""
            fill
            unoptimized
            loading="lazy"
            sizes="(max-width: 640px) 42vw, (max-width: 900px) 30vw, 20vw"
            className={s.patroLogo}
        />
    ) : (
        <GoogleIcon
            name={p.tipo === "institucional" ? "account_balance" : "sports_tennis"}
            className={s.patroLogoIcono}
        />
    );
    const contenido = (
        <>
            <span className={`${s.patroLogoMarco} ${p.fondoOscuro ? s.patroLogoMarcoOscuro : ""}`}>
                {logo}
            </span>
            <span className={s.patroNombre}>{p.nombre}</span>
            <span className={s.patroPruebas} aria-label="Pruebas en las que ha participado">
                {p.pruebas.map((prueba) => (
                    <span className={s.patroPrueba} key={prueba.id}>
                        {prueba.nombre}
                    </span>
                ))}
            </span>
        </>
    );

    if (!p.webUrl) {
        return <div className={s.patroTarjeta}>{contenido}</div>;
    }

    return (
        <a
            href={p.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.nombre} (se abre en otra pestaña)`}
            className={s.patroTarjeta}
            tabIndex={oculto ? -1 : undefined}
        >
            {contenido}
        </a>
    );
}

function CarrilPatrocinadores({
    patrocinadores,
    invertido,
}: {
    patrocinadores: PatrocinadorTarjeta[];
    invertido: boolean;
}) {
    return (
        <div className={`${s.patroCarril} ${invertido ? s.patroCarrilInvertido : ""}`}>
            {[0, 1].map((copia) => (
                <ul className={s.patroGrupo} aria-hidden={copia === 1} key={copia}>
                    {patrocinadores.map((p) => (
                        <li key={p.id}>
                            <LogoPatro p={p} oculto={copia === 1} />
                        </li>
                    ))}
                </ul>
            ))}
        </div>
    );
}

export default function PatrocinadoresHome({ historial }: Props) {
    const patrocinadores = obtenerPatrocinadores(historial);
    const carriles = [
        patrocinadores.filter((_, index) => index % 2 === 0),
        patrocinadores.filter((_, index) => index % 2 === 1),
    ].filter((fila) => fila.length > 0);

    return (
        <section className={`${s.section} ${s.sectionLight}`}>
            <div className={`container ${s.patroGrid}`}>
                <header className={s.patroIntro}>
                    <p className={s.proximaEyebrow}>Juntos hacemos crecer el circuito</p>
                    <h2 className={s.sectionTitle}>Patrocinadores y colaboradores</h2>
                    <p className={s.sectionText}>
                        Cada logotipo indica las pruebas en las que ha colaborado cada empresa.
                    </p>
                </header>

                <div className={s.patroContenido}>
                    {carriles.length > 0 ? (
                        <div
                            className={s.patroCarrusel}
                            role="region"
                            aria-label="Patrocinadores y pruebas en las que han participado"
                        >
                            {carriles.map((fila, index) => (
                                <CarrilPatrocinadores
                                    patrocinadores={fila}
                                    invertido={index === 1}
                                    key={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={s.patroVacio}>
                            <GoogleIcon name="group" />
                            <div>
                                <h3>El histórico está por llegar</h3>
                                <p>Pronto podrás ver aquí qué empresas acompañan cada prueba.</p>
                            </div>
                        </div>
                    )}
                    <Link href="/patrocinadores/historico" className={s.patroVerMas}>
                        Ver más patrocinadores
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
