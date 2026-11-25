import Image from "next/image";
import type { CSSProperties } from "react";
import { colorAvatarJugador, inicialesJugador } from "@/lib/jugadores/avatar";
import s from "./AvatarJugador.module.css";

type Props = {
    nombre: string;
    src: string | null;
    alt?: string;
    className?: string;
    sizes?: string;
    style?: CSSProperties;
};

export default function AvatarJugador({ nombre, src, alt = "", className = "", sizes = "96px", style }: Props) {
    const colorMarca = colorAvatarJugador(nombre);
    const fondo = `var(--color-${colorMarca})`;
    const esNavy = colorMarca === "navy";

    return (
        <span
            className={`${s.avatar} ${className}`.trim()}
            style={{ backgroundColor: fondo, color: esNavy ? "white" : "var(--color-navy)", ...style }}
            aria-label={src ? undefined : nombre}
        >
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    unoptimized={src.startsWith("http")}
                />
            ) : (
                <span aria-hidden="true">{inicialesJugador(nombre)}</span>
            )}
        </span>
    );
}
