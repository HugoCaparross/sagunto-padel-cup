import Image from "next/image";
import { colorAvatarJugador, inicialesJugador } from "@/lib/jugadores/avatar";
import s from "./AvatarJugador.module.css";

type Props = {
    nombre: string;
    src: string | null;
    alt?: string;
    className?: string;
    sizes?: string;
};

export default function AvatarJugador({ nombre, src, alt = "", className = "", sizes = "96px" }: Props) {
    const fondo = colorAvatarJugador(nombre);
    const esNavy = fondo === "#0D1B2A";

    return (
        <span
            className={`${s.avatar} ${className}`.trim()}
            style={{ backgroundColor: fondo, color: esNavy ? "#fff" : "#0D1B2A" }}
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
