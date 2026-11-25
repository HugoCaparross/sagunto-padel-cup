import type { CSSProperties, ReactNode } from "react";

type Props = { eyebrow?: string; titulo: string; descripcion?: string; acciones?: ReactNode; imagen?: string };

export default function CabeceraPagina({ eyebrow, titulo, descripcion, acciones, imagen }: Props) {
    const style: CSSProperties | undefined = imagen ? { backgroundImage: `linear-gradient(90deg, rgb(13 27 42 / .88), rgb(13 27 42 / .72)), url("${imagen}")` } : undefined;
    return <header className={`cabecera-pagina ${imagen ? "cabecera-pagina-imagen" : "cabecera-pagina-clara"}`} style={style}>
        <div className="container py-12 md:py-16 lg:py-20">
            {eyebrow && <p className={`cabecera-pagina-eyebrow spc-etiqueta mb-3 ${imagen ? "" : "text-coral-texto"}`}>{eyebrow}</p>}
            <h1 className="spc-h1 text-balance">{titulo}</h1>
            {descripcion && <p className="mt-4 max-w-2xl spc-cuerpo text-muted">{descripcion}</p>}
            {acciones && <div className="mt-6 flex flex-wrap gap-3">{acciones}</div>}
        </div>
    </header>;
}
