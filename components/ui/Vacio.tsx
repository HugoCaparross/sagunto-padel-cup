import type { ReactNode } from "react";

type Props = { titulo: string; texto: string; cta?: ReactNode; className?: string };
export default function Vacio({ titulo, texto, cta, className = "" }: Props) {
    return <section className={`vacio ${className}`.trim()}>
        <h2 className="spc-h3 text-balance">{titulo}</h2>
        <p className="mt-2 spc-cuerpo text-muted">{texto}</p>
        {cta && <div className="mt-5">{cta}</div>}
    </section>;
}
