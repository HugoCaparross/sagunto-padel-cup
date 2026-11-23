"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
    CATEGORIAS,
    ETIQUETAS_CATEGORIA,
    type Categoria,
} from "@/lib/constantes";
import type { PruebaHome } from "@/lib/home/datos";
import type { PremioPublico } from "@/lib/patrocinio/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type PruebaConPremios = Pick<
    PruebaHome,
    "id" | "slug" | "nombre" | "esMaster" | "categorias"
> & { premios: PremioPublico[] };

type Props = {
    pruebas: PruebaConPremios[];
    pruebaInicialId: string | null;
};

const IMAGENES_PREMIOS = [
    "/images/padel-court.jpg",
    "/images/padel-player.jpg",
    "/images/padel-woman.jpg",
    "/images/padel-hero.jpg",
];
const ORDINALES = ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta"];

function etiquetaPrueba(prueba: PruebaConPremios, numero: number): string {
    if (prueba.esMaster) return "Máster Final";
    return `${ORDINALES[numero] ?? `${numero + 1}.ª`} prueba`;
}

export default function PremiosDestacados({ pruebas, pruebaInicialId }: Props) {
    const [pruebaActivaId, setPruebaActivaId] = useState(
        pruebaInicialId ?? pruebas[0]?.id ?? ""
    );
    const pruebaActiva = pruebas.find((prueba) => prueba.id === pruebaActivaId) ?? pruebas[0];
    const numeroPorId = new Map(
        pruebas
            .filter((prueba) => !prueba.esMaster)
            .map((prueba, index) => [prueba.id, index])
    );
    const categoriasPrueba = pruebaActiva?.categorias.length
        ? pruebaActiva.categorias
        : CATEGORIAS;
    const hrefPremios = pruebaActiva
        ? `/premios?prueba=${encodeURIComponent(pruebaActiva.slug)}`
        : "/premios";

    return (
        <section className={`${s.section} ${s.sectionLight} ${s.premiosBackdrop}`}>
            <div className={`container ${s.premiosSection}`}>
                <header className={s.premiosIntro}>
                    <h2 className={s.sectionTitle}>Premios</h2>
                    <p className={s.sectionText}>
                        Premios para los campeones y subcampeones del cuadro Oro de cada categoría.
                    </p>
                    {pruebas.length > 0 && (
                        <label className={s.premiosSelector}>
                            <span>Elige una prueba</span>
                            <select
                                value={pruebaActiva?.id ?? ""}
                                onChange={(event) => setPruebaActivaId(event.target.value)}
                            >
                                {pruebas.map((prueba) => (
                                    <option key={prueba.id} value={prueba.id}>
                                        {etiquetaPrueba(prueba, numeroPorId.get(prueba.id) ?? 0)}
                                        {prueba.esMaster ? "" : ` · ${prueba.nombre}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <Link href={hrefPremios} className="btn btn-secundario">
                        Ver detalles de premios
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                {pruebaActiva ? (
                    <ul className={s.premiosGrid} aria-live="polite">
                        {categoriasPrueba.map((categoria: Categoria, index) => {
                            const premio = pruebaActiva.premios.find(
                                (item) => item.categoria === categoria && item.cuadro === "oro"
                            );
                            const textoPremio = !premio
                                ? "Premio por confirmar"
                                : premio.revelado
                                  ? premio.descripcion || "Premio anunciado próximamente"
                                  : "El premio se desvelará pronto";

                            return (
                                <li key={categoria}>
                                    <Link href={hrefPremios} className={s.premioCard}>
                                        <Image
                                            src={IMAGENES_PREMIOS[index % IMAGENES_PREMIOS.length]}
                                            alt=""
                                            fill
                                            sizes="(max-width: 760px) 90vw, 25vw"
                                            className={s.premioImagen}
                                        />
                                        <GoogleIcon
                                            name={premio && !premio.revelado ? "lock" : "emoji_events"}
                                            className={s.premioIcono}
                                        />
                                        <span className={s.premioCuadro}>
                                            Campeón y subcampeón · Oro
                                        </span>
                                        <h3 className={s.premioCat}>
                                            {ETIQUETAS_CATEGORIA[categoria]}
                                        </h3>
                                        <p className={s.premioTexto}>{textoPremio}</p>
                                        <span className={s.premioEnlace}>
                                            Conocer premio
                                            <GoogleIcon name="arrow_forward" />
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className={s.premioSinDatos}>Todavía no hay pruebas disponibles.</p>
                )}
            </div>
        </section>
    );
}
